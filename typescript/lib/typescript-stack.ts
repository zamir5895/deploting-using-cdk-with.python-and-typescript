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

        // Asegúrate de combinar props con synthesizer
        super(scope, id, {
            synthesizer: synthesizer,
            ...props
        });

        // Configuración de recursos AWS
        const vpc = ec2.Vpc.fromLookup(this, "ExistingVpc", { vpcId: "vpc-0248bf7539e16364c" });

        const instanceRole = iam.Role.fromRoleArn(this, "ExistingRole", "arn:aws:iam::263293409914:role/LabRole");

        // Usar LookupMachineImage para encontrar la última imagen de Ubuntu
        const ubuntuAmi = new ec2.LookupMachineImage({
            name: "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*",
            owners: ["099720109477"]
        });

        const instance = new ec2.Instance(this, "WebServertypescript", {
            instanceType: new ec2.InstanceType("t2.micro"),
            machineImage: ubuntuAmi,
            vpc: vpc,
            role: instanceRole
        });

        // Comandos de UserData
        const userDataCommands = [
            "apt-get update -y",
            "apt-get install -y git",
            "git clone https://github.com/zamir5895/web-simple.git",
            "git clone https://github.com/zamir5895/web-plantilla.git",
            "cd web-simple",
            "nohup python3 -m http.server 8001 &",
            "cd ../web-plantilla",
            "nohup python3 -m http.server 8002 &"
        ];

        userDataCommands.forEach(cmd => instance.userData.addCommands(cmd));

        // Permisos de red
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(8001), "Allow HTTP traffic on port 8001");
        instance.connections.allowFromAnyIpv4(ec2.Port.tcp(8002), "Allow HTTP traffic on port 8002");
    }
}
