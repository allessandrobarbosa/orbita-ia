import streamlit as st
import pandas as pd
import numpy as np
import requests
import datetime
import plotly.express as px
from typing import Tuple, List, Dict, Any

# ==========================================
# 1. STREAMLIT CONFIG & SLEEK DESIGN SYSTEM
# ==========================================
st.set_page_config(
    page_title="Monitoramento de Diárias e Passagens - MTE",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Sleek Custom CSS to establish a high-tech premium aesthetic
st.markdown("""
<style>
    /* Premium dark blue-gray custom styling */
    .stApp {
        background-color: #F8FAFC;
    }
    h1, h2, h3 {
        color: #0F172A !important;
        font-family: 'Outfit', 'Inter', sans-serif !important;
    }
    
    /* Sleek card container style */
    .metric-card {
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        text-align: left;
    }
    
    /* Strict UI Rules: Only direct metric values, no subtext/variation percentual */
    div[data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 800 !important;
        color: #003366 !important;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 0.85rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: #64748B !important;
    }
    /* Hide the default delta container just in case */
    div[data-testid="stMetricDelta"] {
        display: none !important;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. DATA EXTRACTION AND PROCESSING
# ==========================================
MTE_ORGAN_CODE = "38000"  # Ministério do Trabalho e Emprego

def fetch_viagens_api(api_key: str, date_start: datetime.date, date_end: datetime.date, max_pages: int = 5) -> Tuple[pd.DataFrame, str]:
    """
    Fetches trips data from the CGU Transparência REST API with pagination.
    Falls back to simulated data if token is invalid or request fails.
    """
    if not api_key:
        return pd.DataFrame(), "Chave da API não fornecida. Exibindo dados simulados de teste."

    base_url = "https://api.portaldatransparencia.gov.br/api-de-dados/viagens"
    headers = {
        "chave-api-dados": api_key,
        "Accept": "application/json"
    }

    # Format dates as dd/MM/yyyy for the CGU API
    str_start = date_start.strftime("%d/%m/%Y")
    str_end = date_end.strftime("%d/%m/%Y")

    all_records = []
    
    for page in range(1, max_pages + 1):
        params = {
            "dataIdaDe": str_start,
            "dataIdaAte": str_end,
            "codigoOrgao": MTE_ORGAN_CODE,
            "pagina": page
        }
        
        try:
            response = requests.get(base_url, headers=headers, params=params, timeout=15)
            
            if response.status_code == 401:
                return pd.DataFrame(), "Token Inválido (HTTP 401). Verifique sua Chave da API."
            elif response.status_code == 429:
                return pd.DataFrame(), "Limite de requisições excedido na API da CGU (HTTP 429). Tente novamente mais tarde."
            elif response.status_code != 200:
                return pd.DataFrame(), f"Erro na requisição à API da CGU (HTTP {response.status_code})."
            
            data = response.json()
            if not data or not isinstance(data, list):
                break  # End of pages
            
            all_records.extend(data)
            if len(data) < 15:  # Default page size is usually 15 or 20, if less we are on the last page
                break
        except Exception as e:
            return pd.DataFrame(), f"Falha de conexão com a API da CGU: {str(e)}"

    if not all_records:
        return pd.DataFrame(), "Nenhuma viagem encontrada para o período selecionado no MTE."

    df = pd.DataFrame(all_records)
    return df, "success"

def process_and_enrich_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans and computes operational business rules (Decreto nº 5.992/2006 for SCDP travel).
    """
    if df.empty:
        return df

    # Standardize columns to avoid casing issues
    df.columns = [c[0].lower() + c[1:] if len(c) > 0 else c for c in df.columns]

    # Convert numeric fields
    numeric_cols = ["valorTotal", "valorPassagens", "valorDiarias", "valorOutros", "valorDevolucao", "valorRecebido"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
        else:
            df[col] = 0.0

    # Ensure date fields are parsed
    date_cols = ["dataInicio", "dataFim", "dataPrestacaoContas"]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], format="%d/%m/%Y", errors="coerce")
        else:
            df[col] = pd.NaT

    # Business Rule: SCDP deadline is 5 days from dataFim (return date)
    today = pd.Timestamp(datetime.date.today())
    
    def calculate_status(row):
        return_date = row["dataFim"]
        prestacao_date = row["dataPrestacaoContas"]
        
        if pd.isnull(return_date):
            return "Em Aberto - No Prazo"

        # Case A: Prestação realizada
        if pd.notnull(prestacao_date):
            diff = (prestacao_date - return_date).days
            if diff <= 5:
                return "No Prazo"
            else:
                return "Fora do Prazo (Prestado)"
        
        # Case B: Ainda não prestado (Em Aberto)
        diff_today = (today - return_date).days
        if diff_today <= 5:
            return "Em Aberto - No Prazo"
        else:
            return "Em Aberto - Atrasado"

    df["statusPrestacao"] = df.apply(calculate_status, axis=1)
    
    # Fill text descriptions safely
    df["nomeViajante"] = df["nomeViajante"].fillna("Desconhecido").str.upper()
    df["cpfViajante"] = df["cpfViajante"].fillna("***.***.***-**")
    df["destino"] = df["destino"].fillna("Não Informado")
    df["origem"] = df.get("origem", "BRASÍLIA/DF") # fallback if not in list
    df["trecho"] = df["origem"].astype(str) + " ➔ " + df["destino"].astype(str)
    
    return df

def generate_simulated_data(date_start: datetime.date, date_end: datetime.date) -> pd.DataFrame:
    """
    Generates high-quality realistic simulated SCDP dataset for MTE testing.
    """
    names = [
        "ANA GOMES DA SILVA", "CARLOS EDUARDO SANTOS", "MARIA SOUZA DE OLIVEIRA",
        "ROBERTO PEREIRA ALMEIDA", "JULIANA RODRIGUES LIMA", "FRANCISCO ARAUJO GOMES",
        "PATRICIA COSTA BARBOSA", "FERNANDO MELLO DE ASSIS", "CAMILA LINS CARDOSO",
        "BRUNO MEDEIROS ALVES", "ALINE DIAS PINHEIRO", "GABRIEL SCHMIDT BARROS"
    ]
    
    cpfs = [
        "***.104.991-**", "***.342.115-**", "***.881.092-**",
        "***.451.988-**", "***.209.776-**", "***.552.124-**",
        "***.908.553-**", "***.671.229-**", "***.115.448-**",
        "***.765.221-**", "***.892.404-**", "***.332.901-**"
    ]
    
    cities = [
        "Belo Horizonte/MG", "São Paulo/SP", "Rio de Janeiro/RJ",
        "Salvador/BA", "Recife/PE", "Fortaleza/CE", "Manaus/AM",
        "Curitiba/PR", "Porto Alegre/RS", "Goiânia/GO", "Belém/PA"
    ]

    np.random.seed(42)
    days_range = (date_end - date_start).days
    if days_range <= 0:
        days_range = 30
        
    num_records = 185
    data = []

    for i in range(num_records):
        idx = np.random.randint(0, len(names))
        name = names[idx]
        cpf = cpfs[idx]
        
        # Realistic trip duration
        trip_len = np.random.randint(2, 8)
        start_offset = np.random.randint(0, days_range)
        trip_start = date_start + datetime.timedelta(days=start_offset)
        trip_end = trip_start + datetime.timedelta(days=trip_len)
        
        # Decide prestacao de contas dates realistically
        rand_val = np.random.rand()
        if rand_val < 0.70:
            # 70% chance of being prestado within 5 days
            prestacao_offset = np.random.randint(1, 5)
            prestacao_date = trip_end + datetime.timedelta(days=prestacao_offset)
        elif rand_val < 0.85:
            # 15% chance of being prestado late (e.g. 6 to 15 days after)
            prestacao_offset = np.random.randint(6, 15)
            prestacao_date = trip_end + datetime.timedelta(days=prestacao_offset)
        else:
            # 15% chance of being open (still pending)
            prestacao_date = None
            
        # Realistic trip costs
        diarias = np.random.randint(1, 6) * 450.0
        passagem = 0.0 if np.random.rand() < 0.15 else np.random.randint(1, 4) * 600.0
        total = diarias + passagem
        devolucao = 0.0 if np.random.rand() < 0.90 else np.random.randint(1, 3) * 150.0
        recebido = total - devolucao
        
        data.append({
            "id": int(22000000 + i),
            "numeroViagem": f"{str(np.random.randint(1000, 99999)).zfill(5)}/{str(trip_start.year)[2:]}",
            "cpfViajante": cpf,
            "nomeViajante": name,
            "dataInicio": trip_start.strftime("%d/%m/%Y"),
            "dataFim": trip_end.strftime("%d/%m/%Y"),
            "dataPrestacaoContas": prestacao_date.strftime("%d/%m/%Y") if prestacao_date else None,
            "origem": "Brasília/DF" if np.random.rand() < 0.75 else cities[np.random.randint(0, len(cities))],
            "destino": cities[np.random.randint(0, len(cities))],
            "valorTotal": total,
            "valorPassagens": passagem,
            "valorDiarias": diarias,
            "valorOutros": 0.0,
            "valorDevolucao": devolucao,
            "valorRecebido": recebido
        })
        
    df = pd.DataFrame(data)
    return df

# ==========================================
# 3. INTERFACE DE USUÁRIO (STREAMLIT)
# ==========================================

# 3.1. Sidebar for filter configuration
st.sidebar.markdown("<h2 style='font-size: 1.25rem; font-weight: 800; color: #003366; margin-bottom: 20px;'>Configurações de Filtro</h2>", unsafe_allow_html=True)

# Secure API Token Header entry
api_key = st.sidebar.text_input(
    label="Chave API Portal da Transparência",
    type="password",
    help="Insira o seu token de acesso da API de Dados Abertos da CGU. Se deixado vazio, o sistema usará dados simulados."
)

# Date Filters
today_dt = datetime.date.today()
default_start = today_dt - datetime.timedelta(days=120)
date_start = st.sidebar.date_input("Data de Início", default_start)
date_end = st.sidebar.date_input("Data de Fim", today_dt)

# Pagination Limit
max_pages = st.sidebar.slider("Limite de Páginas da API", min_value=1, max_value=20, value=5, help="Controle a profundidade da busca paginada para otimizar o tempo de resposta.")

st.sidebar.markdown("---")
st.sidebar.markdown(
    "<p style='font-size: 10px; color: #94A3B8;'>Órbita-AECI SCDP Engine v1.0.0<br>"
    "Filtro padrão: <strong>Órgão Superior 38000 (MTE)</strong></p>",
    unsafe_allow_html=True
)

# 3.2. Main layout Header
st.title("Monitoramento de Diárias e Passagens — SCDP")
st.caption("Controle governamental de viagens a serviço do Ministério do Trabalho e Emprego (MTE) em conformidade com o Decreto nº 5.992/2006.")

# Fetch and process data
with st.spinner("Buscando dados no Portal da Transparência da CGU..."):
    if api_key:
        raw_df, status = fetch_viagens_api(api_key, date_start, date_end, max_pages)
        if status == "success":
            df = process_and_enrich_data(raw_df)
            st.success("Dados carregados com sucesso diretamente da API do Portal da Transparência.")
        else:
            st.warning(f"{status} Utilizando dados simulados de teste para fins demonstrativos.")
            raw_df = generate_simulated_data(date_start, date_end)
            df = process_and_enrich_data(raw_df)
    else:
        st.info("Demonstração: Exibindo dados simulados do MTE. Adicione uma chave API na barra lateral para habilitar a integração em tempo real.")
        raw_df = generate_simulated_data(date_start, date_end)
        df = process_and_enrich_data(raw_df)

if not df.empty:
    # Filter by date range in processed df
    df = df[(df["dataInicio"].dt.date >= date_start) & (df["dataInicio"].dt.date <= date_end)]

# Verify if data is empty after filtering
if df.empty:
    st.error("Nenhuma viagem disponível nos filtros selecionados.")
else:
    # ==========================================
    # 4. KPIs & METRICAS (STRICT UI METRIC RULE)
    # ==========================================
    # Strict UI Rule: No subtitles/variation percentual. Just Indicator Title and Value in bold.
    total_viagens = len(df)
    total_gasto = df["valorTotal"].sum()
    total_diarias = df["valorDiarias"].sum()
    total_passagens = df["valorPassagens"].sum()
    total_devolvido = df["valorDevolucao"].sum()
    total_recebido = df["valorRecebido"].sum()

    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric("Total de Viagens", f"{total_viagens}")
    with col2:
        st.metric("Valor Total Gasto", f"R$ {total_gasto:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    with col3:
        st.metric("Valor Diárias", f"R$ {total_diarias:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    with col4:
        st.metric("Valor Passagens", f"R$ {total_passagens:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    with col5:
        st.metric("Total Devolvido", f"R$ {total_devolvido:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

    st.markdown("<br>", unsafe_allow_html=True)

    # ==========================================
    # 5. CHARTS (HORIZONTAL MINIMALIST DESIGN)
    # ==========================================
    col_left, col_right = st.columns(2)

    with col_left:
        st.markdown("<h3 style='font-size: 1.1rem; font-weight: 800; color: #003366; margin-bottom: 12px;'>Ranking dos 10 Viajantes com Maior Recebimento</h3>", unsafe_allow_html=True)
        # Group by name and aggregate received values
        ranking_usuarios = df.groupby(["nomeViajante", "cpfViajante"])["valorRecebido"].sum().reset_index()
        ranking_usuarios = ranking_usuarios.sort_values(by="valorRecebido", ascending=False).head(10)
        # Obfuscate names/CPFs slightly for display
        ranking_usuarios["Viajante"] = ranking_usuarios["nomeViajante"] + " (" + ranking_usuarios["cpfViajante"] + ")"
        
        fig_user = px.bar(
            ranking_usuarios,
            x="valorRecebido",
            y="Viajante",
            orientation="h",
            color_discrete_sequence=["#003366"],
            labels={"valorRecebido": "Total Recebido (R$)", "Viajante": "Servidor Viajante"}
        )
        fig_user.update_layout(
            yaxis={'categoryorder': 'total ascending'},
            xaxis_title=None,
            yaxis_title=None,
            margin=dict(l=0, r=10, t=10, b=10),
            height=320,
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)"
        )
        fig_user.update_xaxes(showgrid=True, gridcolor="#F1F5F9")
        st.plotly_chart(fig_user, use_container_width=True)

    with col_right:
        st.markdown("<h3 style='font-size: 1.1rem; font-weight: 800; color: #003366; margin-bottom: 12px;'>Ranking dos Trechos (Origem-Destino) Mais Utilizados</h3>", unsafe_allow_html=True)
        # Group by route and count occurrences
        ranking_trechos = df.groupby("trecho").size().reset_index(name="Frequência")
        ranking_trechos = ranking_trechos.sort_values(by="Frequência", ascending=False).head(10)
        
        fig_route = px.bar(
            ranking_trechos,
            x="Frequência",
            y="trecho",
            orientation="h",
            color_discrete_sequence=["#64748B"],
            labels={"Frequência": "Quantidade de Viagens", "trecho": "Trecho Percorrido"}
        )
        fig_route.update_layout(
            yaxis={'categoryorder': 'total ascending'},
            xaxis_title=None,
            yaxis_title=None,
            margin=dict(l=0, r=10, t=10, b=10),
            height=320,
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)"
        )
        fig_route.update_xaxes(showgrid=True, gridcolor="#F1F5F9")
        st.plotly_chart(fig_route, use_container_width=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ==========================================
    # 6. TABLE AND STATUS REPORT
    # ==========================================
    st.markdown("<h3 style='font-size: 1.1rem; font-weight: 800; color: #003366; margin-bottom: 6px;'>Detalhamento de Viagens e Prestação de Contas (Decreto nº 5.992/06)</h3>", unsafe_allow_html=True)
    st.caption("Verificação eletrônica de conformidade técnica: prazo máximo legal para prestar contas é de 5 dias corridos após o retorno.")

    # Status distribution summary
    status_counts = df["statusPrestacao"].value_counts().reset_index(name="Qtd")
    status_counts.columns = ["Status Prestação", "Quantidade"]
    
    # Render badges or visual tags for the summary status
    cols_status = st.columns(len(status_counts))
    for idx, row in status_counts.iterrows():
        status_label = row["Status Prestação"]
        status_qty = row["Quantidade"]
        with cols_status[idx]:
            # Apply color style according to status
            card_color = "#E0F2FE" # Blue-Sky
            text_color = "#0369A1"
            if "Atrasado" in status_label:
                card_color = "#FFE4E6" # Soft-Rose
                text_color = "#BE123C"
            elif "No Prazo" == status_label:
                card_color = "#D1FAE5" # Soft-Emerald
                text_color = "#047857"
            
            st.markdown(
                f"<div style='background-color: {card_color}; color: {text_color}; padding: 10px 16px; border-radius: 12px; font-weight: bold; text-align: center; font-size: 0.8rem;'>"
                f"{status_label}: {status_qty} viagens"
                f"</div>",
                unsafe_allow_html=True
            )

    st.markdown("<br>", unsafe_allow_html=True)

    # Prepare user-friendly detailed DataFrame
    display_df = df.copy()
    display_df["Data Partida"] = display_df["dataInicio"].dt.strftime("%d/%m/%Y")
    display_df["Data Retorno"] = display_df["dataFim"].dt.strftime("%d/%m/%Y")
    display_df["Data Prestação"] = display_df["dataPrestacaoContas"].dt.strftime("%d/%m/%Y").fillna("Pendente")
    
    # Format Currency for the table view
    display_df["Valor Total (R$)"] = display_df["valorTotal"].map(lambda x: f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    display_df["Diárias (R$)"] = display_df["valorDiarias"].map(lambda x: f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    display_df["Passagens (R$)"] = display_df["valorPassagens"].map(lambda x: f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    
    table_cols = [
        "numeroViagem", "cpfViajante", "nomeViajante", "trecho", 
        "Data Partida", "Data Retorno", "Data Prestação", 
        "Valor Total (R$)", "Diárias (R$)", "Passagens (R$)", "statusPrestacao"
    ]
    
    final_table_df = display_df[table_cols].copy()
    final_table_df.columns = [
        "Número Viagem", "CPF Viajante", "Nome Viajante", "Trecho (Origem ➔ Destino)", 
        "Data Partida", "Data Retorno", "Data Prestação", 
        "Valor Total", "Valor Diárias", "Valor Passagens", "Status da Prestação"
    ]

    # Interactive DataFrame table with built-in search and sorting
    st.dataframe(
        final_table_df,
        use_container_width=True,
        hide_index=True
    )
