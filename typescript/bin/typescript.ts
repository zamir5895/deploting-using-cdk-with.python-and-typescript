#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebAppStack } from '../lib/typescript-stack';  // Asegúrate de que la ruta de importación sea correcta

const app = new cdk.App();
new WebAppStack(app, 'WebAppStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT || '263293409914',  // Usa una cuenta por defecto si la variable de entorno no está definida
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1'  // Usa una región por defecto si la variable de entorno no está definida
    }
});

app.synth();
