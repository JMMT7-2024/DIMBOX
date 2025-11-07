# backend/backend/views.py
from django.http import HttpResponse
from django.shortcuts import render


def home(request):
    return HttpResponse("Bienvenido a la API del backend")
