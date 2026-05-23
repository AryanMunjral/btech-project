#!/usr/bin/env python3
"""
Generate all 15 missing figures for the DTU B.Tech report.
Figures 9-13 already exist in ml-api/outputs/.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, ArrowStyle
import numpy as np
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'figures')
os.makedirs(OUT, exist_ok=True)

# ── Colour palette ────────────────────────────────────────
C_BLUE   = '#2563EB'
C_DBLUE  = '#1E40AF'
C_LBLUE  = '#DBEAFE'
C_GREEN  = '#059669'
C_LGREEN = '#D1FAE5'
C_RED    = '#DC2626'
C_LRED   = '#FEE2E2'
C_AMBER  = '#D97706'
C_LAMBER = '#FEF3C7'
C_PURPLE = '#7C3AED'
C_LPURP  = '#EDE9FE'
C_GRAY   = '#6B7280'
C_LGRAY  = '#F3F4F6'
C_DGRAY  = '#374151'
C_WHITE  = '#FFFFFF'
C_BG     = '#FAFAFA'

DPI = 200


def _box(ax, x, y, w, h, text, facecolor=C_LBLUE, edgecolor=C_BLUE,
         fontsize=8, fontweight='bold', textcolor=C_DGRAY, radius=0.02):
    """Draw a rounded rectangle with centered text."""
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0,rounding_size={radius}",
                         facecolor=facecolor, edgecolor=edgecolor, linewidth=1.2)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight=fontweight, color=textcolor,
            wrap=True)
    return box


def _arrow(ax, x1, y1, x2, y2, color=C_GRAY, style='->', lw=1.2):
    """Draw an arrow between two points."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw))


def _arrow_label(ax, x1, y1, x2, y2, label='', color=C_GRAY):
    """Draw an arrow with a label at the midpoint."""
    _arrow(ax, x1, y1, x2, y2, color=color)
    mx, my = (x1+x2)/2, (y1+y2)/2
    if label:
        ax.text(mx, my+0.02, label, ha='center', va='bottom',
                fontsize=6, color=color, style='italic')


# ═══════════════════════════════════════════════════════════
#  FIGURE 1: High-Level System Architecture
# ═══════════════════════════════════════════════════════════
def fig1_system_architecture():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    # Title
    ax.text(0.5, 0.96, 'High-Level System Architecture', ha='center', va='top',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    # User layer
    _box(ax, 0.02, 0.78, 0.18, 0.10, 'Web Browser\n(User)', C_LAMBER, C_AMBER)
    _box(ax, 0.02, 0.64, 0.18, 0.10, 'Mobile Client\n(User)', C_LAMBER, C_AMBER)

    # Frontend
    _box(ax, 0.30, 0.68, 0.18, 0.18, 'React Frontend\n(Vite, Port 5173)\n\nTailwind CSS\nReact Router v6\nAxios + JWT',
         C_LPURP, C_PURPLE, fontsize=7)

    # Backend
    _box(ax, 0.58, 0.55, 0.18, 0.32, 'Express.js\nBackend\n(Port 5000)\n\nJWT Auth\nZod Validation\nPrisma ORM\nREST API\nRate Limiting',
         C_LBLUE, C_BLUE, fontsize=7)

    # ML API
    _box(ax, 0.58, 0.15, 0.18, 0.18, 'FastAPI\nML Service\n(Port 8000)\n\nXGBoost Model\n/predict endpoint',
         C_LGREEN, C_GREEN, fontsize=7)

    # Database
    _box(ax, 0.85, 0.60, 0.13, 0.15, 'PostgreSQL\n(Port 5432)\n\nUsers\nTransactions\nAlerts',
         C_LRED, C_RED, fontsize=7)

    # Model files
    _box(ax, 0.85, 0.18, 0.13, 0.10, 'Model Files\n(.pkl)', C_LGRAY, C_GRAY, fontsize=7)

    # Arrows
    _arrow(ax, 0.20, 0.83, 0.30, 0.82, C_AMBER)
    _arrow(ax, 0.20, 0.69, 0.30, 0.73, C_AMBER)
    _arrow_label(ax, 0.48, 0.77, 0.58, 0.77, 'REST API', C_PURPLE)
    _arrow_label(ax, 0.76, 0.71, 0.85, 0.71, 'Prisma', C_BLUE)
    _arrow_label(ax, 0.67, 0.55, 0.67, 0.33, 'HTTP /predict', C_GREEN)
    _arrow(ax, 0.85, 0.23, 0.76, 0.23, C_GRAY)

    # Layer labels
    ax.text(0.11, 0.60, 'Client Layer', ha='center', fontsize=8, color=C_AMBER,
            fontweight='bold', style='italic')
    ax.text(0.39, 0.63, 'Presentation', ha='center', fontsize=8, color=C_PURPLE,
            fontweight='bold', style='italic')
    ax.text(0.67, 0.50, 'Business Logic', ha='center', fontsize=8, color=C_BLUE,
            fontweight='bold', style='italic')
    ax.text(0.915, 0.50, 'Data Layer', ha='center', fontsize=8, color=C_RED,
            fontweight='bold', style='italic')

    # Dual-mode label
    _box(ax, 0.30, 0.15, 0.18, 0.10, 'Rule-Based\nFallback', C_LAMBER, C_AMBER, fontsize=7)
    _arrow(ax, 0.48, 0.20, 0.58, 0.24, C_AMBER)
    ax.text(0.53, 0.27, 'if ML\nunavailable', ha='center', fontsize=5, color=C_AMBER, style='italic')

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig01_system_architecture.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 2: Request Processing Pipeline
# ═══════════════════════════════════════════════════════════
def fig2_request_pipeline():
    fig, ax = plt.subplots(1, 1, figsize=(12, 3.5))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.95, 'Request Processing Pipeline (Middleware Chain)', ha='center',
            fontsize=13, fontweight='bold', color=C_DGRAY)

    stages = [
        ('Helmet\n(Security\nHeaders)', C_LRED, C_RED),
        ('CORS\n(Origin\nWhitelist)', C_LAMBER, C_AMBER),
        ('Rate\nLimiter\n(100/15m)', C_LAMBER, C_AMBER),
        ('Morgan\n(HTTP\nLogging)', C_LGRAY, C_GRAY),
        ('Body\nParser\n(JSON 1MB)', C_LGRAY, C_GRAY),
        ('Router', C_LBLUE, C_BLUE),
        ('JWT Auth\nMiddleware', C_LPURP, C_PURPLE),
        ('Zod\nValidation', C_LPURP, C_PURPLE),
        ('Route\nHandler', C_LGREEN, C_GREEN),
        ('Error\nHandler', C_LRED, C_RED),
    ]

    n = len(stages)
    bw = 0.075
    spacing = (0.92 - n * bw) / (n - 1)
    y0 = 0.25

    # HTTP Request label
    ax.text(0.01, y0 + 0.15, 'HTTP\nRequest', ha='center', va='center',
            fontsize=7, fontweight='bold', color=C_BLUE)

    for i, (label, fc, ec) in enumerate(stages):
        x = 0.04 + i * (bw + spacing)
        _box(ax, x, y0, bw, 0.45, label, fc, ec, fontsize=6.5, radius=0.01)
        if i < n - 1:
            _arrow(ax, x + bw + 0.003, y0 + 0.225, x + bw + spacing - 0.003, y0 + 0.225, ec)

    # Response label
    ax.text(0.97, y0 + 0.15, 'HTTP\nResponse', ha='center', va='center',
            fontsize=7, fontweight='bold', color=C_GREEN)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig02_request_pipeline.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 3: Entity-Relationship Diagram
# ═══════════════════════════════════════════════════════════
def fig3_er_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(10, 7))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.97, 'Entity-Relationship Diagram', ha='center',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    # Users entity
    ux, uy, uw, uh = 0.05, 0.40, 0.25, 0.45
    _box(ax, ux, uy, uw, uh, '', C_LBLUE, C_BLUE, radius=0.01)
    ax.text(ux + uw/2, uy + uh - 0.03, 'USERS', ha='center', va='top',
            fontsize=11, fontweight='bold', color=C_DBLUE)
    user_fields = [
        'PK  id : INTEGER',
        '     name : VARCHAR(100)',
        '     email : VARCHAR(150) UNIQUE',
        '     password : VARCHAR(255)',
        '     upiId : VARCHAR(100) UNIQUE',
        '     phone : VARCHAR(15)',
        '     balance : DECIMAL(12,2)',
        '     role : ENUM',
        '     isActive : BOOLEAN',
        '     createdAt : TIMESTAMPTZ',
        '     updatedAt : TIMESTAMPTZ',
    ]
    for i, f in enumerate(user_fields):
        ax.text(ux + 0.015, uy + uh - 0.07 - i*0.035, f, fontsize=6,
                fontfamily='monospace', color=C_DGRAY)

    # Transactions entity
    tx, ty, tw, th = 0.38, 0.18, 0.28, 0.72
    _box(ax, tx, ty, tw, th, '', C_LGREEN, C_GREEN, radius=0.01)
    ax.text(tx + tw/2, ty + th - 0.03, 'TRANSACTIONS', ha='center', va='top',
            fontsize=11, fontweight='bold', color='#047857')
    txn_fields = [
        'PK  id : INTEGER',
        '     transactionId : VARCHAR(50)',
        '     amount : DECIMAL(12,2)',
        '     transactionType : ENUM',
        '     isFraud : BOOLEAN',
        '     fraudProbability : DECIMAL(5,4)',
        '     riskLevel : VARCHAR(10)',
        '     status : ENUM',
        'FK  senderId : INTEGER → Users',
        'FK  receiverId : INTEGER → Users',
        '     senderUpi : VARCHAR(100)',
        '     receiverUpi : VARCHAR(100)',
        '     senderBalanceBefore : DECIMAL',
        '     receiverBalanceBefore : DECIMAL',
        '     description : TEXT',
        '     mlResponse : JSONB',
        '     detectionMethod : VARCHAR',
        '     createdAt : TIMESTAMPTZ',
    ]
    for i, f in enumerate(txn_fields):
        ax.text(tx + 0.015, ty + th - 0.07 - i*0.035, f, fontsize=5.5,
                fontfamily='monospace', color=C_DGRAY)

    # Alerts entity
    alx, aly, alw, alh = 0.74, 0.40, 0.24, 0.45
    _box(ax, alx, aly, alw, alh, '', C_LRED, C_RED, radius=0.01)
    ax.text(alx + alw/2, aly + alh - 0.03, 'ALERTS', ha='center', va='top',
            fontsize=11, fontweight='bold', color=C_RED)
    alert_fields = [
        'PK  id : INTEGER',
        '     type : ENUM',
        '     severity : ENUM',
        '     title : VARCHAR(200)',
        '     message : TEXT',
        '     isRead : BOOLEAN',
        '     isResolved : BOOLEAN',
        'FK  userId : INTEGER → Users',
        'FK  transactionId : INT → Txn',
        '     createdAt : TIMESTAMPTZ',
        '     updatedAt : TIMESTAMPTZ',
    ]
    for i, f in enumerate(alert_fields):
        ax.text(alx + 0.015, aly + alh - 0.07 - i*0.035, f, fontsize=6,
                fontfamily='monospace', color=C_DGRAY)

    # Relationship arrows
    # Users -> Transactions (sender)
    ax.annotate('', xy=(tx, 0.72), xytext=(ux + uw, 0.72),
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.5))
    ax.text((ux + uw + tx)/2, 0.75, 'sends (1:N)', ha='center', fontsize=7,
            color=C_BLUE, fontweight='bold')

    # Users -> Transactions (receiver)
    ax.annotate('', xy=(tx, 0.58), xytext=(ux + uw, 0.58),
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.5,
                                linestyle='dashed'))
    ax.text((ux + uw + tx)/2, 0.55, 'receives (1:N)', ha='center', fontsize=7,
            color=C_BLUE, fontweight='bold')

    # Transactions -> Alerts
    ax.annotate('', xy=(alx, 0.62), xytext=(tx + tw, 0.62),
                arrowprops=dict(arrowstyle='->', color=C_GREEN, lw=1.5))
    ax.text((tx + tw + alx)/2, 0.65, 'generates (0..1:N)', ha='center', fontsize=7,
            color=C_GREEN, fontweight='bold')

    # Users -> Alerts
    ax.annotate('', xy=(alx, 0.78), xytext=(ux + uw/2 + 0.05, 0.85),
                arrowprops=dict(arrowstyle='->', color=C_RED, lw=1.5,
                                connectionstyle='arc3,rad=-0.3'))
    ax.text(0.52, 0.88, 'has alerts (1:N)', ha='center', fontsize=7,
            color=C_RED, fontweight='bold')

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig03_er_diagram.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 4: Transaction Processing Data Flow
# ═══════════════════════════════════════════════════════════
def fig4_transaction_flow():
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.97, 'Transaction Processing Data Flow', ha='center',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    steps = [
        (0.35, 0.88, 0.30, 0.06, 'Client Submits Transaction', C_LAMBER, C_AMBER),
        (0.35, 0.78, 0.30, 0.06, '1. Zod Schema Validation', C_LPURP, C_PURPLE),
        (0.35, 0.68, 0.30, 0.06, '2. User Lookup (Sender + Receiver)', C_LBLUE, C_BLUE),
        (0.35, 0.58, 0.30, 0.06, '3. Balance Verification', C_LBLUE, C_BLUE),
        (0.35, 0.48, 0.30, 0.06, '4. ML Fraud Assessment', C_LGREEN, C_GREEN),
        (0.35, 0.33, 0.30, 0.06, '5. Threshold Classification', C_LPURP, C_PURPLE),
        (0.35, 0.23, 0.30, 0.06, '6. Atomic DB Transaction', C_LRED, C_RED),
        (0.35, 0.13, 0.30, 0.06, '7. Alert Generation', C_LAMBER, C_AMBER),
        (0.35, 0.03, 0.30, 0.06, '8. JSON Response', C_LGREEN, C_GREEN),
    ]

    for (x, y, w, h, label, fc, ec) in steps:
        _box(ax, x, y, w, h, label, fc, ec, fontsize=8, radius=0.008)

    # Arrows between steps
    for i in range(len(steps) - 1):
        if i == 4:  # Gap between ML assessment and threshold
            _arrow(ax, 0.5, steps[i][1], 0.5, steps[i+1][1] + steps[i+1][3] + 0.005, C_GRAY)
        else:
            _arrow(ax, 0.5, steps[i][1], 0.5, steps[i+1][1] + steps[i+1][3] + 0.005, C_GRAY)

    # ML Service branch
    _box(ax, 0.72, 0.46, 0.22, 0.10, 'FastAPI ML Service\n(XGBoost /predict)',
         C_LGREEN, C_GREEN, fontsize=7)
    _arrow_label(ax, 0.65, 0.51, 0.72, 0.51, 'HTTP POST', C_GREEN)

    # Rule-based fallback branch
    _box(ax, 0.05, 0.44, 0.22, 0.10, 'Rule-Based\nFallback Scoring',
         C_LAMBER, C_AMBER, fontsize=7)
    _arrow(ax, 0.35, 0.49, 0.27, 0.49, C_AMBER)
    ax.text(0.31, 0.47, 'if ML\ndown', ha='center', fontsize=5.5, color=C_AMBER, style='italic')

    # Threshold branches
    ax.text(0.72, 0.37, '≥ 0.85 → BLOCKED\n≥ 0.50 → FLAGGED\n< 0.50 → COMPLETED',
            fontsize=6.5, fontfamily='monospace', color=C_DGRAY,
            bbox=dict(boxstyle='round,pad=0.3', facecolor=C_LGRAY, edgecolor=C_GRAY))

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig04_transaction_flow.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 5: Authentication and JWT Flow
# ═══════════════════════════════════════════════════════════
def fig5_auth_jwt_flow():
    fig, ax = plt.subplots(1, 1, figsize=(11, 7))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.97, 'Authentication & JWT Token Flow', ha='center',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    # Actors
    _box(ax, 0.02, 0.85, 0.12, 0.06, 'React\nFrontend', C_LPURP, C_PURPLE, fontsize=8)
    _box(ax, 0.42, 0.85, 0.12, 0.06, 'Express.js\nBackend', C_LBLUE, C_BLUE, fontsize=8)
    _box(ax, 0.82, 0.85, 0.12, 0.06, 'PostgreSQL\nDB', C_LRED, C_RED, fontsize=8)

    # Vertical lifelines
    for x in [0.08, 0.48, 0.88]:
        ax.plot([x, x], [0.05, 0.85], color=C_LGRAY, lw=1, linestyle='--')

    # Login flow
    y = 0.78
    ax.annotate('', xy=(0.48, y), xytext=(0.08, y),
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.5))
    ax.text(0.28, y + 0.015, '1. POST /api/auth/login {email, password}', ha='center',
            fontsize=6.5, color=C_BLUE)

    y = 0.72
    ax.annotate('', xy=(0.88, y), xytext=(0.48, y),
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.5))
    ax.text(0.68, y + 0.015, '2. Find user by email', ha='center', fontsize=6.5, color=C_BLUE)

    y = 0.66
    ax.annotate('', xy=(0.48, y), xytext=(0.88, y),
                arrowprops=dict(arrowstyle='->', color=C_RED, lw=1.5))
    ax.text(0.68, y + 0.015, '3. Return user record', ha='center', fontsize=6.5, color=C_RED)

    # bcrypt box
    y = 0.59
    ax.text(0.48, y, '4. bcrypt.compare(password, hash)',
            fontsize=6.5, color=C_DGRAY, fontfamily='monospace',
            bbox=dict(boxstyle='round,pad=0.2', facecolor=C_LGRAY, edgecolor=C_GRAY))

    y = 0.52
    ax.text(0.48, y, '5. Generate JWT tokens\n   accessToken (24h) + refreshToken (7d)',
            fontsize=6.5, color=C_DGRAY,
            bbox=dict(boxstyle='round,pad=0.2', facecolor=C_LAMBER, edgecolor=C_AMBER))

    y = 0.44
    ax.annotate('', xy=(0.08, y), xytext=(0.48, y),
                arrowprops=dict(arrowstyle='->', color=C_GREEN, lw=1.5))
    ax.text(0.28, y + 0.015, '6. Return {accessToken, refreshToken, user}', ha='center',
            fontsize=6.5, color=C_GREEN)

    y = 0.38
    ax.text(0.02, y, '7. Store tokens in localStorage',
            fontsize=6.5, color=C_DGRAY, fontfamily='monospace',
            bbox=dict(boxstyle='round,pad=0.2', facecolor=C_LPURP, edgecolor=C_PURPLE))

    # Protected request
    y = 0.30
    ax.annotate('', xy=(0.48, y), xytext=(0.08, y),
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.5))
    ax.text(0.28, y + 0.015, '8. GET /api/transactions  Authorization: Bearer <token>',
            ha='center', fontsize=6.5, color=C_BLUE)

    y = 0.24
    ax.text(0.48, y, '9. jwt.verify(token, secret)',
            fontsize=6.5, color=C_DGRAY, fontfamily='monospace',
            bbox=dict(boxstyle='round,pad=0.2', facecolor=C_LGRAY, edgecolor=C_GRAY))

    # 401 refresh flow
    y = 0.16
    ax.annotate('', xy=(0.08, y), xytext=(0.48, y),
                arrowprops=dict(arrowstyle='->', color=C_RED, lw=1.5, linestyle='dashed'))
    ax.text(0.28, y + 0.015, '10. 401 Unauthorized (token expired)', ha='center',
            fontsize=6.5, color=C_RED)

    y = 0.10
    ax.annotate('', xy=(0.48, y), xytext=(0.08, y),
                arrowprops=dict(arrowstyle='->', color=C_AMBER, lw=1.5, linestyle='dashed'))
    ax.text(0.28, y + 0.015, '11. POST /api/auth/refresh {refreshToken}',
            ha='center', fontsize=6.5, color=C_AMBER)

    y = 0.04
    ax.annotate('', xy=(0.08, y), xytext=(0.48, y),
                arrowprops=dict(arrowstyle='->', color=C_GREEN, lw=1.5, linestyle='dashed'))
    ax.text(0.28, y + 0.015, '12. New accessToken → retry original request',
            ha='center', fontsize=6.5, color=C_GREEN)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig05_auth_jwt_flow.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 6: XGBoost Training Pipeline
# ═══════════════════════════════════════════════════════════
def fig6_xgboost_pipeline():
    fig, ax = plt.subplots(1, 1, figsize=(12, 5))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.95, 'XGBoost Model Training Pipeline', ha='center',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    # Pipeline stages (left to right, two rows)
    row1 = [
        (0.02, 0.62, 0.14, 0.20, 'Raw Data\n\n50,000 Txns\n8% Fraud', C_LGRAY, C_GRAY),
        (0.20, 0.62, 0.14, 0.20, 'Feature\nEngineering\n\n28 Features\n5 Categories', C_LAMBER, C_AMBER),
        (0.38, 0.62, 0.14, 0.20, 'Preprocessing\n\nImputation\nOutlier Cap\nStandardize', C_LBLUE, C_BLUE),
        (0.56, 0.62, 0.14, 0.20, 'Train/Test\nSplit\n\n80/20\nStratified', C_LPURP, C_PURPLE),
        (0.74, 0.62, 0.14, 0.20, 'SMOTE\n\nOversample\nFraud to 30%\nk=5 neighbors', C_LRED, C_RED),
    ]

    row2 = [
        (0.74, 0.18, 0.14, 0.20, 'XGBoost\nTraining\n\n200 trees\ndepth=6\nlr=0.1', C_LGREEN, C_GREEN),
        (0.56, 0.18, 0.14, 0.20, 'Evaluation\n\nAccuracy 97.2%\nAUC 0.987\nF1 0.893', C_LBLUE, C_BLUE),
        (0.38, 0.18, 0.14, 0.20, 'Threshold\nTuning\n\n0.50 optimal\nF1 maximized', C_LPURP, C_PURPLE),
        (0.20, 0.18, 0.14, 0.20, 'Serialize\n\nmodel.pkl\nscaler.pkl\nlabel_enc.pkl', C_LAMBER, C_AMBER),
        (0.02, 0.18, 0.14, 0.20, 'FastAPI\nDeployment\n\n/predict\n/health\n28ms latency', C_LGREEN, C_GREEN),
    ]

    for (x, y, w, h, label, fc, ec) in row1:
        _box(ax, x, y, w, h, label, fc, ec, fontsize=6.5, radius=0.008)

    for (x, y, w, h, label, fc, ec) in row2:
        _box(ax, x, y, w, h, label, fc, ec, fontsize=6.5, radius=0.008)

    # Arrows row1
    for i in range(len(row1) - 1):
        x1 = row1[i][0] + row1[i][2]
        x2 = row1[i+1][0]
        y = row1[i][1] + row1[i][3]/2
        _arrow(ax, x1+0.005, y, x2-0.005, y, C_GRAY)

    # Arrow from row1 to row2 (turn)
    _arrow(ax, 0.81, 0.62, 0.81, 0.38, C_GRAY)

    # Arrows row2
    for i in range(len(row2) - 1):
        x1 = row2[i][0]
        x2 = row2[i+1][0] + row2[i+1][2]
        y = row2[i][1] + row2[i][3]/2
        _arrow(ax, x1-0.005, y, x2+0.005, y, C_GRAY)

    # U-shaped pipeline label
    ax.annotate('', xy=(0.95, 0.72), xytext=(0.95, 0.28),
                arrowprops=dict(arrowstyle='-', color=C_LGRAY, lw=2, linestyle='dotted'))

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig06_xgboost_pipeline.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 7: Feature Engineering Categories
# ═══════════════════════════════════════════════════════════
def fig7_feature_categories():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(C_WHITE)

    ax.text(0.5, 0.96, 'Feature Engineering Categories (28 Features)', ha='center',
            fontsize=14, fontweight='bold', color=C_DGRAY)

    # Central node
    _box(ax, 0.35, 0.50, 0.30, 0.10, '28 Engineered\nFeatures', C_LBLUE, C_DBLUE, fontsize=10)

    # Categories
    categories = [
        (0.02, 0.78, 0.22, 0.14,
         'Amount Features (5)\n\ntransaction_amount\namount_log\nis_high_amount\nis_very_high_amount\namount_is_round',
         C_LGREEN, C_GREEN),
        (0.28, 0.78, 0.22, 0.14,
         'Balance Features (5)\n\namount_to_balance_ratio\nbalance_after_negative\nbalance_pct_spent\nreceiver_balance_log\nbalance_diff',
         C_LAMBER, C_AMBER),
        (0.54, 0.78, 0.22, 0.14,
         'Temporal Features (9)\n\nhour, day_of_week\nis_night, is_weekend\nis_early_morning\nhour_sin, hour_cos\ndow_sin, dow_cos',
         C_LPURP, C_PURPLE),
        (0.80, 0.78, 0.18, 0.14,
         'Categorical (1)\n\ntransaction_type\n_encoded\n(ordinal)',
         C_LGRAY, C_GRAY),
        (0.30, 0.12, 0.40, 0.14,
         'Behavioural Features (8)\n\nsender_txn_count, sender_avg_amount, amount_vs_sender_avg\nsender_last_txn_time, is_rapid_txn\nsender_unique_devices, sender_unique_receivers, sender_unique_locations',
         C_LRED, C_RED),
    ]

    for (x, y, w, h, label, fc, ec) in categories:
        _box(ax, x, y, w, h, label, fc, ec, fontsize=5.8, fontweight='normal', radius=0.008)

    # Arrows from center to categories
    cx, cy = 0.50, 0.60
    targets_top = [(0.13, 0.78), (0.39, 0.78), (0.65, 0.78), (0.89, 0.78)]
    for (tx, ty) in targets_top:
        _arrow(ax, cx, cy, tx, ty, C_DGRAY)

    # Arrow to bottom
    _arrow(ax, cx, 0.50, cx, 0.26, C_DGRAY)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig07_feature_categories.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 8: SMOTE Oversampling Visualization
# ═══════════════════════════════════════════════════════════
def fig8_smote_viz():
    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    fig.suptitle('SMOTE Oversampling Visualization', fontsize=14, fontweight='bold',
                 color=C_DGRAY, y=1.02)
    fig.patch.set_facecolor(C_WHITE)

    np.random.seed(42)

    # Panel 1: Original imbalanced
    ax = axes[0]
    n_legit = 200
    n_fraud = 16  # 8%
    x_legit = np.random.randn(n_legit) * 1.5 + 2
    y_legit = np.random.randn(n_legit) * 1.5 + 2
    x_fraud = np.random.randn(n_fraud) * 0.8 + 5
    y_fraud = np.random.randn(n_fraud) * 0.8 + 5
    ax.scatter(x_legit, y_legit, c=C_BLUE, alpha=0.4, s=15, label=f'Legitimate ({n_legit})')
    ax.scatter(x_fraud, y_fraud, c=C_RED, alpha=0.8, s=25, label=f'Fraud ({n_fraud})')
    ax.set_title('Before SMOTE\n(8% Fraud)', fontsize=10, fontweight='bold')
    ax.legend(fontsize=7, loc='upper left')
    ax.set_xlabel('Feature 1', fontsize=8)
    ax.set_ylabel('Feature 2', fontsize=8)

    # Panel 2: SMOTE synthetic generation
    ax = axes[1]
    n_synth = 44  # to reach 30% of legitimate
    x_synth = np.random.randn(n_synth) * 1.0 + 5
    y_synth = np.random.randn(n_synth) * 1.0 + 5
    ax.scatter(x_legit, y_legit, c=C_BLUE, alpha=0.4, s=15, label=f'Legitimate ({n_legit})')
    ax.scatter(x_fraud, y_fraud, c=C_RED, alpha=0.8, s=25, label=f'Original Fraud ({n_fraud})')
    ax.scatter(x_synth, y_synth, c=C_AMBER, alpha=0.6, s=25, marker='*',
               label=f'SMOTE Synthetic ({n_synth})')
    ax.set_title('SMOTE Generation\n(k=5 Neighbors)', fontsize=10, fontweight='bold')
    ax.legend(fontsize=6, loc='upper left')
    ax.set_xlabel('Feature 1', fontsize=8)

    # Panel 3: Class distribution bar chart
    ax = axes[2]
    cats = ['Before\nSMOTE', 'After\nSMOTE']
    legit_counts = [n_legit, n_legit]
    fraud_counts = [n_fraud, n_fraud + n_synth]
    x_pos = np.arange(len(cats))
    w = 0.35
    bars1 = ax.bar(x_pos - w/2, legit_counts, w, color=C_BLUE, alpha=0.7, label='Legitimate')
    bars2 = ax.bar(x_pos + w/2, fraud_counts, w, color=C_RED, alpha=0.7, label='Fraud')
    ax.set_xticks(x_pos)
    ax.set_xticklabels(cats, fontsize=9)
    ax.set_ylabel('Sample Count', fontsize=9)
    ax.set_title('Class Distribution', fontsize=10, fontweight='bold')
    ax.legend(fontsize=8)
    for bar, val in zip(bars1, legit_counts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                str(val), ha='center', fontsize=8, fontweight='bold')
    for bar, val in zip(bars2, fraud_counts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                str(val), ha='center', fontsize=8, fontweight='bold')

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig08_smote_visualization.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURES 14-19: UI Wireframe Screenshots
# ═══════════════════════════════════════════════════════════
def _ui_frame(ax, title='Page Title'):
    """Draw a common browser/app frame."""
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')

    # Browser bar
    _box(ax, 0, 0.93, 1.0, 0.07, '', '#E5E7EB', '#D1D5DB', radius=0.005)
    ax.plot([0.02, 0.025], [0.965, 0.965], 'o', color=C_RED, markersize=4)
    ax.plot([0.04, 0.045], [0.965, 0.965], 'o', color=C_AMBER, markersize=4)
    ax.plot([0.06, 0.065], [0.965, 0.965], 'o', color=C_GREEN, markersize=4)
    ax.text(0.5, 0.965, f'localhost:5173/{title.lower().replace(" ", "-")}',
            ha='center', va='center', fontsize=7, color=C_GRAY)

    # Sidebar
    _box(ax, 0, 0, 0.18, 0.93, '', '#1F2937', '#111827', radius=0.0)
    ax.text(0.09, 0.88, 'UPI Fraud\nDetection', ha='center', fontsize=7,
            fontweight='bold', color=C_WHITE)

    nav_items = ['Dashboard', 'Transactions', 'Check Txn', 'Alerts', 'Analytics']
    for i, item in enumerate(nav_items):
        y = 0.78 - i * 0.06
        is_active = item.strip().lower().startswith(title.lower()[:4])
        bg = C_BLUE if is_active else '#374151'
        _box(ax, 0.01, y - 0.02, 0.16, 0.04, item, bg, bg, fontsize=6,
             textcolor=C_WHITE, radius=0.005)

    return ax


def fig14_login():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis('off')

    # Browser bar only (no sidebar for login)
    _box(ax, 0, 0.93, 1.0, 0.07, '', '#E5E7EB', '#D1D5DB', radius=0.005)
    ax.text(0.5, 0.965, 'localhost:5173/login', ha='center', fontsize=7, color=C_GRAY)

    # Background
    _box(ax, 0, 0, 1.0, 0.93, '', '#F9FAFB', '#E5E7EB', radius=0.0)

    # Login card
    _box(ax, 0.30, 0.18, 0.40, 0.65, '', C_WHITE, '#E5E7EB', radius=0.01)

    # Logo and title
    ax.text(0.50, 0.78, '[Logo]', ha='center', fontsize=12, color=C_BLUE, fontweight='bold')
    ax.text(0.50, 0.72, 'UPI Fraud Detection', ha='center', fontsize=12,
            fontweight='bold', color=C_DGRAY)
    ax.text(0.50, 0.68, 'Sign in to your account', ha='center', fontsize=8, color=C_GRAY)

    # Email field
    ax.text(0.34, 0.61, 'Email Address', fontsize=7, fontweight='bold', color=C_DGRAY)
    _box(ax, 0.34, 0.55, 0.32, 0.05, 'admin@example.com', '#F9FAFB', '#D1D5DB',
         fontsize=7, fontweight='normal', textcolor=C_GRAY, radius=0.005)

    # Password field
    ax.text(0.34, 0.50, 'Password', fontsize=7, fontweight='bold', color=C_DGRAY)
    _box(ax, 0.34, 0.44, 0.32, 0.05, '••••••••', '#F9FAFB', '#D1D5DB',
         fontsize=7, fontweight='normal', textcolor=C_GRAY, radius=0.005)

    # Login button
    _box(ax, 0.34, 0.34, 0.32, 0.06, 'Sign In', C_BLUE, C_DBLUE,
         fontsize=9, textcolor=C_WHITE, radius=0.005)

    # Demo credentials
    _box(ax, 0.34, 0.22, 0.32, 0.08, 'Demo Accounts:\nadmin@example.com / password123\nuser@example.com / password123',
         C_LBLUE, C_BLUE, fontsize=5.5, fontweight='normal', radius=0.005)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig14_login_page.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


def fig15_dashboard():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    _ui_frame(ax, 'Dashboard')

    # KPI Cards
    kpis = [
        ('Total Txns', '12,847', '+12.5%', C_BLUE),
        ('Fraud Detected', '342', '+3.2%', C_RED),
        ('Legitimate', '12,505', '+13.1%', C_GREEN),
        ('Total Volume', '₹8.4Cr', '+15.8%', C_PURPLE),
    ]
    for i, (label, val, change, color) in enumerate(kpis):
        x = 0.20 + i * 0.19
        _box(ax, x, 0.75, 0.17, 0.12, '', C_WHITE, '#E5E7EB', radius=0.005)
        ax.text(x + 0.085, 0.84, label, ha='center', fontsize=6, color=C_GRAY)
        ax.text(x + 0.085, 0.80, val, ha='center', fontsize=10, fontweight='bold', color=color)
        ax.text(x + 0.085, 0.77, change, ha='center', fontsize=6, color=C_GREEN)

    # Chart area (trend)
    _box(ax, 0.20, 0.38, 0.50, 0.33, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.22, 0.68, '7-Day Transaction Trend', fontsize=8, fontweight='bold', color=C_DGRAY)
    # Fake chart line
    xs = np.linspace(0.22, 0.67, 7)
    ys = [0.48, 0.52, 0.50, 0.55, 0.53, 0.58, 0.56]
    ax.fill_between(xs, 0.40, ys, alpha=0.2, color=C_BLUE)
    ax.plot(xs, ys, color=C_BLUE, lw=2)

    # Pie charts
    _box(ax, 0.72, 0.38, 0.26, 0.33, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.74, 0.68, 'Risk Distribution', fontsize=7, fontweight='bold', color=C_DGRAY)
    # Mini pie
    wedges = [0.65, 0.25, 0.10]
    colors = [C_GREEN, C_AMBER, C_RED]
    labels_pie = ['Low', 'Medium', 'High']
    theta1 = 90
    cx_pie, cy_pie, r = 0.85, 0.52, 0.08
    for w, c, lb in zip(wedges, colors, labels_pie):
        theta2 = theta1 - w * 360
        t = np.linspace(np.radians(theta2), np.radians(theta1), 30)
        xs_pie = cx_pie + r * np.cos(t)
        ys_pie = cy_pie + r * np.sin(t)
        ax.fill(np.append(cx_pie, xs_pie), np.append(cy_pie, ys_pie), color=c, alpha=0.7)
        theta1 = theta2

    # Recent transactions table
    _box(ax, 0.20, 0.04, 0.78, 0.30, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.22, 0.31, 'Recent Transactions', fontsize=8, fontweight='bold', color=C_DGRAY)
    headers = ['Txn ID', 'Sender', 'Receiver', 'Amount', 'Risk', 'Status']
    for i, h in enumerate(headers):
        ax.text(0.22 + i * 0.125, 0.27, h, fontsize=5.5, fontweight='bold', color=C_GRAY)
    # Sample rows
    rows = [
        ['TXN001', 'user1@upi', 'shop@upi', '₹2,500', 'LOW', 'COMPLETED'],
        ['TXN002', 'user2@upi', 'user3@upi', '₹45,000', 'HIGH', 'BLOCKED'],
        ['TXN003', 'user4@upi', 'bill@upi', '₹1,200', 'LOW', 'COMPLETED'],
        ['TXN004', 'user5@upi', 'user6@upi', '₹8,900', 'MED', 'FLAGGED'],
    ]
    for r_idx, row in enumerate(rows):
        y = 0.23 - r_idx * 0.04
        for c_idx, val in enumerate(row):
            color = C_DGRAY
            if val == 'HIGH': color = C_RED
            elif val == 'BLOCKED': color = C_RED
            elif val == 'LOW': color = C_GREEN
            elif val == 'COMPLETED': color = C_GREEN
            elif val == 'MED': color = C_AMBER
            elif val == 'FLAGGED': color = C_AMBER
            ax.text(0.22 + c_idx * 0.125, y, val, fontsize=5, color=color)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig15_dashboard.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


def fig16_transactions():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    _ui_frame(ax, 'Transactions')

    # Header
    ax.text(0.20, 0.88, 'Transactions', fontsize=12, fontweight='bold', color=C_DGRAY)

    # Filters bar
    _box(ax, 0.20, 0.80, 0.78, 0.06, '', C_WHITE, '#E5E7EB', radius=0.005)
    filters = ['Search by ID/UPI...', 'Fraud: All ▾', 'Status: All ▾', 'Risk: All ▾']
    for i, f in enumerate(filters):
        _box(ax, 0.21 + i * 0.19, 0.81, 0.17, 0.04, f, '#F9FAFB', '#D1D5DB',
             fontsize=5.5, fontweight='normal', textcolor=C_GRAY, radius=0.003)

    # Table
    _box(ax, 0.20, 0.05, 0.78, 0.72, '', C_WHITE, '#E5E7EB', radius=0.005)
    headers = ['Txn ID', 'Sender UPI', 'Receiver UPI', 'Amount', 'Type', 'Risk', 'Fraud %', 'Status', 'Date']
    for i, h in enumerate(headers):
        ax.text(0.21 + i * 0.085, 0.73, h, fontsize=5, fontweight='bold', color=C_GRAY)
    ax.plot([0.21, 0.97], [0.72, 0.72], color='#E5E7EB', lw=0.5)

    rows = [
        ['TXN170589', 'alice@okaxis', 'shop1@ybl', '₹2,500', 'P2M', 'LOW', '3.2%', 'COMPLETED', '2026-05-18'],
        ['TXN170590', 'bob@oksbi', 'eve@paytm', '₹48,000', 'P2P', 'HIGH', '92.1%', 'BLOCKED', '2026-05-18'],
        ['TXN170591', 'carol@upi', 'airtel@bill', '₹899', 'BILL', 'LOW', '1.8%', 'COMPLETED', '2026-05-17'],
        ['TXN170592', 'dave@okicici', 'frank@ybl', '₹15,200', 'P2P', 'MED', '67.4%', 'FLAGGED', '2026-05-17'],
        ['TXN170593', 'grace@oksbi', 'shop2@upi', '₹3,400', 'P2M', 'LOW', '5.1%', 'COMPLETED', '2026-05-16'],
        ['TXN170594', 'henry@paytm', 'ivan@ybl', '₹72,000', 'P2P', 'HIGH', '95.8%', 'BLOCKED', '2026-05-16'],
        ['TXN170595', 'jane@okaxis', 'jio@rech', '₹499', 'RECH', 'LOW', '0.9%', 'COMPLETED', '2026-05-15'],
        ['TXN170596', 'kate@oksbi', 'larry@upi', '₹9,800', 'P2P', 'MED', '54.3%', 'FLAGGED', '2026-05-15'],
    ]

    for r_idx, row in enumerate(rows):
        y = 0.69 - r_idx * 0.075
        bg = C_WHITE if r_idx % 2 == 0 else '#F9FAFB'
        _box(ax, 0.20, y - 0.025, 0.78, 0.065, '', bg, bg, radius=0.0)
        for c_idx, val in enumerate(row):
            color = C_DGRAY
            if val in ('HIGH',): color = C_RED
            elif val in ('BLOCKED',): color = C_RED
            elif val in ('LOW',): color = C_GREEN
            elif val in ('COMPLETED',): color = C_GREEN
            elif val in ('MED',): color = C_AMBER
            elif val in ('FLAGGED',): color = C_AMBER
            fw = 'bold' if c_idx in (5, 7) else 'normal'
            ax.text(0.21 + c_idx * 0.085, y, val, fontsize=4.5, color=color, fontweight=fw)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig16_transactions_page.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


def fig17_check_transaction():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    _ui_frame(ax, 'Check')

    ax.text(0.20, 0.88, 'Check Transaction', fontsize=12, fontweight='bold', color=C_DGRAY)

    # Form
    _box(ax, 0.20, 0.35, 0.35, 0.50, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.22, 0.82, 'Submit New Transaction', fontsize=9, fontweight='bold', color=C_DGRAY)

    fields = [
        ('Sender UPI ID', 'alice@okaxis'),
        ('Receiver UPI ID', 'shop1@ybl'),
        ('Amount (₹)', '2500'),
        ('Transaction Type', 'P2M ▾'),
        ('Sender Balance (opt)', '15000'),
    ]
    for i, (label, placeholder) in enumerate(fields):
        y = 0.76 - i * 0.08
        ax.text(0.22, y, label, fontsize=6, fontweight='bold', color=C_DGRAY)
        _box(ax, 0.22, y - 0.045, 0.31, 0.035, placeholder, '#F9FAFB', '#D1D5DB',
             fontsize=6, fontweight='normal', textcolor=C_GRAY, radius=0.003)

    _box(ax, 0.22, 0.36, 0.31, 0.045, 'Analyze Transaction', C_BLUE, C_DBLUE,
         fontsize=8, textcolor=C_WHITE, radius=0.005)

    # Result panel
    _box(ax, 0.58, 0.35, 0.38, 0.50, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.60, 0.82, 'Analysis Result', fontsize=9, fontweight='bold', color=C_DGRAY)

    # Green verdict
    _box(ax, 0.60, 0.70, 0.34, 0.08, '✅ LEGITIMATE', C_LGREEN, C_GREEN, fontsize=11)

    results = [
        ('Fraud Probability:', '3.2%'),
        ('Confidence:', '96.8%'),
        ('Risk Level:', 'LOW'),
        ('Detection Method:', 'XGBoost ML Model'),
        ('Status:', 'COMPLETED'),
        ('Balance Updated:', 'Yes (₹15,000 → ₹12,500)'),
    ]
    for i, (k, v) in enumerate(results):
        y = 0.65 - i * 0.04
        ax.text(0.61, y, k, fontsize=6, fontweight='bold', color=C_GRAY)
        color = C_GREEN if 'LOW' in v or 'COMPLETED' in v or 'LEGITIMATE' in v else C_DGRAY
        ax.text(0.79, y, v, fontsize=6, color=color, fontweight='bold')

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig17_check_transaction.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


def fig18_alerts():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    _ui_frame(ax, 'Alerts')

    ax.text(0.20, 0.88, 'Alerts', fontsize=12, fontweight='bold', color=C_DGRAY)

    # Stats bar
    stats = [
        ('Total Alerts', '156', C_BLUE),
        ('Unread', '23', C_AMBER),
        ('Critical', '8', C_RED),
        ('High', '34', '#DC2626'),
    ]
    for i, (label, val, color) in enumerate(stats):
        x = 0.20 + i * 0.19
        _box(ax, x, 0.78, 0.17, 0.08, '', C_WHITE, '#E5E7EB', radius=0.005)
        ax.text(x + 0.085, 0.84, label, ha='center', fontsize=6, color=C_GRAY)
        ax.text(x + 0.085, 0.80, val, ha='center', fontsize=10, fontweight='bold', color=color)

    # Filter buttons
    filter_labels = ['All', 'Critical', 'High', 'Medium', 'Low']
    filter_colors = [C_BLUE, C_RED, '#DC2626', C_AMBER, C_GREEN]
    for i, (fl, fc) in enumerate(zip(filter_labels, filter_colors)):
        _box(ax, 0.20 + i * 0.10, 0.72, 0.08, 0.035, fl,
             fc if i == 0 else C_WHITE, fc, fontsize=6,
             textcolor=C_WHITE if i == 0 else fc, radius=0.003)

    # Alert cards
    alerts = [
        ('CRITICAL', 'Fraud Detected — High Amount Transfer',
         'Transaction TXN170590 flagged with 92.1% fraud probability. Amount: ₹48,000.',
         '2 hours ago', True),
        ('HIGH', 'Suspicious Night Transaction',
         'Transaction TXN170594 at 2:34 AM with 95.8% fraud probability. Amount: ₹72,000.',
         '6 hours ago', True),
        ('MEDIUM', 'Unusual Transaction Pattern',
         'Transaction TXN170592 shows rapid successive pattern. Amount: ₹15,200.',
         '1 day ago', False),
        ('LOW', 'High Amount Transfer',
         'Transaction TXN170589 above ₹10,000 threshold. Amount: ₹2,500. Verified legitimate.',
         '2 days ago', False),
    ]

    for i, (severity, title, msg, time, unread) in enumerate(alerts):
        y = 0.57 - i * 0.14
        bg = '#FFFBEB' if unread else C_WHITE
        _box(ax, 0.20, y, 0.78, 0.12, '', bg, '#E5E7EB', radius=0.005)
        ax.text(0.22, y + 0.09, severity, fontsize=6, fontweight='bold')
        ax.text(0.35, y + 0.09, title, fontsize=7, fontweight='bold', color=C_DGRAY)
        ax.text(0.22, y + 0.05, msg, fontsize=5.5, color=C_GRAY, wrap=True)
        ax.text(0.22, y + 0.015, time, fontsize=5, color=C_GRAY, style='italic')
        # Action buttons
        _box(ax, 0.80, y + 0.06, 0.08, 0.03, 'Mark Read', C_LBLUE, C_BLUE,
             fontsize=5, radius=0.002)
        _box(ax, 0.89, y + 0.06, 0.07, 0.03, 'Resolve', C_LGREEN, C_GREEN,
             fontsize=5, radius=0.002)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig18_alerts_page.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


def fig19_analytics():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6))
    fig.patch.set_facecolor(C_WHITE)
    _ui_frame(ax, 'Analytics')

    ax.text(0.20, 0.88, 'Analytics', fontsize=12, fontweight='bold', color=C_DGRAY)

    # ML Status panel
    _box(ax, 0.20, 0.74, 0.78, 0.10, '', C_LGREEN, C_GREEN, radius=0.005)
    ax.text(0.22, 0.81, 'ML Service: ONLINE', fontsize=8, fontweight='bold', color='#047857')
    ax.text(0.22, 0.76, 'Model: XGBoost v1.0  |  Uptime: 48h 23m  |  Predictions: 12,847  |  Avg Latency: 28ms',
            fontsize=6, color='#047857')

    # Chart 1: Volume trend
    _box(ax, 0.20, 0.38, 0.38, 0.32, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.22, 0.67, 'Transaction Volume Trend', fontsize=7, fontweight='bold', color=C_DGRAY)
    xs = np.linspace(0.22, 0.55, 14)
    ys = np.array([120, 135, 128, 142, 138, 155, 160, 148, 165, 172, 168, 180, 175, 190]) / 250 * 0.20 + 0.42
    ax.fill_between(xs, 0.42, ys, alpha=0.2, color=C_BLUE)
    ax.plot(xs, ys, color=C_BLUE, lw=1.5)

    # Chart 2: Fraud rate trend
    _box(ax, 0.60, 0.38, 0.38, 0.32, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.62, 0.67, 'Fraud Rate Trend (%)', fontsize=7, fontweight='bold', color=C_DGRAY)
    ys2 = np.array([8.2, 7.8, 8.5, 7.2, 6.9, 7.5, 7.1, 6.8, 7.3, 6.5, 6.2, 6.8, 6.0, 5.8]) / 12 * 0.20 + 0.42
    ax.plot(np.linspace(0.62, 0.95, 14), ys2, color=C_RED, lw=1.5)
    ax.fill_between(np.linspace(0.62, 0.95, 14), 0.42, ys2, alpha=0.15, color=C_RED)

    # Chart 3: Amount distribution
    _box(ax, 0.20, 0.04, 0.38, 0.30, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.22, 0.31, 'Amount Distribution', fontsize=7, fontweight='bold', color=C_DGRAY)
    bar_xs = np.linspace(0.24, 0.52, 8)
    bar_hs = [0.18, 0.22, 0.16, 0.12, 0.08, 0.05, 0.03, 0.01]
    for bx, bh in zip(bar_xs, bar_hs):
        ax.bar(bx, bh, width=0.03, bottom=0.08, color=C_BLUE, alpha=0.7)

    # Chart 4: Risk by type
    _box(ax, 0.60, 0.04, 0.38, 0.30, '', C_WHITE, '#E5E7EB', radius=0.005)
    ax.text(0.62, 0.31, 'Risk by Transaction Type', fontsize=7, fontweight='bold', color=C_DGRAY)
    types = ['P2P', 'P2M', 'BILL', 'RECH']
    for i, t in enumerate(types):
        bx = 0.67 + i * 0.065
        ax.bar(bx, 0.12, width=0.02, bottom=0.08, color=C_GREEN, alpha=0.7)
        ax.bar(bx + 0.02, 0.06, width=0.02, bottom=0.08, color=C_AMBER, alpha=0.7)
        ax.bar(bx + 0.04, 0.03, width=0.02, bottom=0.08, color=C_RED, alpha=0.7)
        ax.text(bx + 0.02, 0.06, t, ha='center', fontsize=5, color=C_GRAY)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig19_analytics_page.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  FIGURE 20: Gantt Chart
# ═══════════════════════════════════════════════════════════
def fig20_gantt_chart():
    fig, ax = plt.subplots(1, 1, figsize=(12, 6))
    fig.patch.set_facecolor(C_WHITE)

    tasks = [
        ('Phase 1: Requirements & Setup', 0, 2),
        ('Phase 2: Synthetic Data Gen', 2, 1),
        ('Phase 3: Feature Engineering', 3, 2),
        ('Phase 4: Model Training & Eval', 5, 2),
        ('Phase 5: FastAPI ML Service', 7, 1),
        ('Phase 6: DB Schema & Prisma', 8, 1),
        ('Phase 7: Express.js Backend', 9, 3),
        ('Phase 8: React Frontend', 12, 3),
        ('Phase 9: Integration & Bugfix', 15, 1),
        ('Phase 10: Testing & Validation', 16, 1),
        ('Phase 11: Report & Docs', 17, 2),
    ]

    colors = [C_BLUE, C_GREEN, C_AMBER, C_RED, C_GREEN, C_PURPLE,
              C_BLUE, C_PURPLE, C_AMBER, C_RED, C_GRAY]

    n = len(tasks)
    for i, ((name, start, dur), color) in enumerate(zip(tasks, colors)):
        y = n - 1 - i
        ax.barh(y, dur, left=start, height=0.6, color=color, alpha=0.75,
                edgecolor='white', linewidth=0.5)
        ax.text(start + dur/2, y, f'{dur}w', ha='center', va='center',
                fontsize=7, fontweight='bold', color=C_WHITE)

    ax.set_yticks(range(n))
    ax.set_yticklabels([t[0] for t in reversed(tasks)], fontsize=8)
    ax.set_xlabel('Weeks from Project Start', fontsize=10)
    ax.set_title('Project Gantt Chart — January to May 2026 (19 Weeks)',
                 fontsize=13, fontweight='bold', color=C_DGRAY, pad=15)

    # Month markers
    month_weeks = [0, 4, 8, 13, 17]
    month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    ax2 = ax.twiny()
    ax2.set_xlim(ax.get_xlim())
    ax2.set_xticks(month_weeks)
    ax2.set_xticklabels(month_labels, fontsize=9, fontweight='bold')
    ax2.set_xlabel('2026', fontsize=10)

    ax.set_xlim(-0.5, 20)
    ax.grid(axis='x', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()
    fig.savefig(os.path.join(OUT, 'fig20_gantt_chart.png'), dpi=DPI,
                bbox_inches='tight', facecolor=C_WHITE)
    plt.close()


# ═══════════════════════════════════════════════════════════
#  GENERATE ALL
# ═══════════════════════════════════════════════════════════
if __name__ == '__main__':
    generators = [
        ('Figure 1:  System Architecture', fig1_system_architecture),
        ('Figure 2:  Request Pipeline', fig2_request_pipeline),
        ('Figure 3:  ER Diagram', fig3_er_diagram),
        ('Figure 4:  Transaction Flow', fig4_transaction_flow),
        ('Figure 5:  Auth & JWT Flow', fig5_auth_jwt_flow),
        ('Figure 6:  XGBoost Pipeline', fig6_xgboost_pipeline),
        ('Figure 7:  Feature Categories', fig7_feature_categories),
        ('Figure 8:  SMOTE Visualization', fig8_smote_viz),
        ('Figure 14: Login Page', fig14_login),
        ('Figure 15: Dashboard', fig15_dashboard),
        ('Figure 16: Transactions Page', fig16_transactions),
        ('Figure 17: Check Transaction', fig17_check_transaction),
        ('Figure 18: Alerts Page', fig18_alerts),
        ('Figure 19: Analytics Page', fig19_analytics),
        ('Figure 20: Gantt Chart', fig20_gantt_chart),
    ]

    for name, func in generators:
        print(f'  Generating {name}...')
        func()

    print(f'\n✅ All 15 figures saved to: {OUT}/')
    for f in sorted(os.listdir(OUT)):
        print(f'   {f}')
