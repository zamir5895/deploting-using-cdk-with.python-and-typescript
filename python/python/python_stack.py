from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    DefaultStackSynthesizer,
)
from constructs import Construct


class WebAppStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        synthesizer = DefaultStackSynthesizer(
            file_assets_bucket_name="zamirpruebitacloud",
            bucket_prefix="",
            cloud_formation_execution_role="arn:aws:iam::263293409914:role/LabRole",
            deploy_role_arn="arn:aws:iam::263293409914:role/LabRole",
            file_asset_publishing_role_arn="arn:aws:iam::263293409914:role/LabRole",
            image_asset_publishing_role_arn="arn:aws:iam::263293409914:role/LabRole"
        )

        super().__init__(scope, id, synthesizer=synthesizer, **kwargs)

        # Configuración de la VPC y roles de la instancia
        vpc = ec2.Vpc.from_lookup(self, "ExistingVpc", vpc_id="vpc-0248bf7539e16364c")
        instance_role = iam.Role.from_role_arn(
            self, "ExistingRole", role_arn="arn:aws:iam::263293409914:role/LabRole"
        )

        # Selección de la imagen de Ubuntu para la instancia
        ubuntu_ami = ec2.LookupMachineImage(
            name="ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*",
            owners=["099720109477"]
        )

        # Creación de la instancia EC2
        instance = ec2.Instance(
            self, "MaquinaUsandoPythonApache",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ubuntu_ami,
            vpc=vpc,
            role=instance_role
        )

        # Comandos para configurar Apache y servir los sitios en los puertos 8001 y 8002
        user_data_commands = [
            "sudo apt-get update -y",
            "sudo apt-get install -y apache2 git",
            "sudo systemctl start apache2",
            "sudo systemctl enable apache2",
            "sudo echo 'Listen 8001' >> /etc/apache2/ports.conf",
            "sudo echo 'Listen 8002' >> /etc/apache2/ports.conf",
            "sudo git clone https://github.com/zamir5895/web-simple.git /var/www/web-simple",
            "sudo git clone https://github.com/zamir5895/web-plantilla.git /var/www/web-plantilla",
            "echo '<VirtualHost *:8001>' | sudo tee /etc/apache2/sites-available/web-simple.conf",
            "echo '    DocumentRoot /var/www/web-simple' | sudo tee -a /etc/apache2/sites-available/web-simple.conf",
            "echo '    ErrorLog ${APACHE_LOG_DIR}/error.log' | sudo tee -a /etc/apache2/sites-available/web-simple.conf",
            "echo '    CustomLog ${APACHE_LOG_DIR}/access.log combined' | sudo tee -a /etc/apache2/sites-available/web-simple.conf",
            "echo '</VirtualHost>' | sudo tee -a /etc/apache2/sites-available/web-simple.conf",
            "echo '<VirtualHost *:8002>' | sudo tee /etc/apache2/sites-available/web-plantilla.conf",
            "echo '    DocumentRoot /var/www/web-plantilla' | sudo tee -a /etc/apache2/sites-available/web-plantilla.conf",
            "echo '    ErrorLog ${APACHE_LOG_DIR}/error.log' | sudo tee -a /etc/apache2/sites-available/web-plantilla.conf",
            "echo '    CustomLog ${APACHE_LOG_DIR}/access.log combined' | sudo tee -a /etc/apache2/sites-available/web-plantilla.conf",
            "echo '</VirtualHost>' | sudo tee -a /etc/apache2/sites-available/web-plantilla.conf",
            "sudo a2ensite web-simple",
            "sudo a2ensite web-plantilla",
            "sudo systemctl restart apache2"
        ]

        # Agregar los comandos de configuración al User Data de la instancia
        instance.user_data.add_commands(*user_data_commands)

        # Permisos de red para los puertos 8001, 8002, 80 y 22
        instance.connections.allow_from_any_ipv4(ec2.Port.tcp(80), "Allow HTTP traffic on port 80")
        instance.connections.allow_from_any_ipv4(ec2.Port.tcp(22), "Allow SSH traffic on port 22")
        instance.connections.allow_from_any_ipv4(ec2.Port.tcp(8001), "Allow HTTP traffic on port 8001")
        instance.connections.allow_from_any_ipv4(ec2.Port.tcp(8002), "Allow HTTP traffic on port 8002")
