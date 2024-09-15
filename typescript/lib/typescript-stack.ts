import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class WebAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        const synthesizer = new cdk.DefaultStackSynthesizer({
            fileAssetsBucketName: "zamirawstypescipt",
            bucketPrefix: "",
            cloudFormationExecutionRole: "arn:aws:iam::263293409914:role/LabRole",
            deployRoleArn: "arn:aws:iam::263293409914:role/LabRole",
            fileAssetPublishingRoleArn: "arn:aws:iam::263293409914:role/LabRole",
            imageAssetPublishingRoleArn: "arn:aws:iam::263293409914:role/LabRole"
        });

        super(scope, id, { synthesizer, ...props });

        const vpc = ec2.Vpc.fromLookup(this, "ExistingVpc", { vpcId: "vpc-0248bf7539e16364c" });
        const instanceRole = iam.Role.fromRoleArn(this, "ExistingRole", "arn:aws:iam::263293409914:role/LabRole");
        const ubuntuAmi = new ec2.LookupMachineImage({
            name: "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*",
            owners: ["099720109477"]
        });

        const instance = new ec2.Instance(this, "MaquinaUsandoTypescriptApache", {
            instanceType: new ec2.InstanceType("t2.micro"),
            machineImage: ubuntuAmi,
            vpc: vpc,
            role: instanceRole
        });

        // Configuración de UserData para instalar Apache y configurar los sitios en diferentes puertos
        const userDataCommands = [
            "sudo apt-get update -y",
            "sudo apt-get install -y apache2 git",
            "sudo systemctl start apache2",
            "sudo systemctl enable apache2",
            // Configurar Apache para escuchar en los puertos 8001 y 8002
            "sudo echo 'Listen 8001' >> /etc/apache2/ports.conf",
            "sudo echo 'Listen 8002' >> /etc/apache2/ports.conf",
            // Clonar los repositorios
            "sudo git clone https://github.com/zamir5895/web-simple.git /var/www/web-simple",
            "sudo git clone https://github.com/zamir5895/web-plantilla.git /var/www/web-plantilla",
            // Configurar Virtual Hosts para cada sitio en sus respectivos puertos
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
            // Activar los sitios y reiniciar Apache
            "sudo a2ensite web-simple",
            "sudo a2ensite web-plantilla",
            "sudo systemctl restart apache2"
        ];

        userDataCommands.forEach(cmd => instance.userData.addCommands(cmd));

        // Permisos de red para permitir tráfico HTTP en los puertos 80, 8001, 8002 y SSH en el puerto 22
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80), "Allow HTTP traffic on port 80");
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22), "Allow SSH traffic on port 22");
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(8001), "Allow HTTP traffic on port 8001");
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(8002), "Allow HTTP traffic on port 8002");
    }
}
