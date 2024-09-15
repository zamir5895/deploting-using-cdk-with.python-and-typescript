#!/usr/bin/env python3
import os
from aws_cdk import App
from python.python_stack import WebAppStack  # Asegúrate de que la ruta de importación sea correcta

app = App()

# Crea una instancia de WebAppStack pasando la app como 'scope' y proporcionando el nombre del stack.
# Ahora usando el Account ID obtenido de tu comando AWS CLI.
WebAppStack(app, "WebAppStack", env={
    'account': '263293409914',  # Tu Account ID de AWS
    'region': os.getenv('CDK_DEFAULT_REGION')  # Utiliza una variable de entorno o define la región directamente
})

app.synth()
