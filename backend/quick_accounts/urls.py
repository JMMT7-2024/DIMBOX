from django.urls import path
from . import views

app_name = "quick_accounts"

urlpatterns = [
    path("", views.QuickAccountsView.as_view(), name="quick-accounts"),
]
