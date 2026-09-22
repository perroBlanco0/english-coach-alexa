$ErrorActionPreference = "Stop"
$PROFILE_NAME = "hackathon"
$REGION = "us-east-1"

Write-Host "== 1/3 EC2 =="
$AMI_ID = aws ec2 describe-images --profile $PROFILE_NAME --region $REGION `
  --owners amazon `
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" `
  --query "sort_by(Images,&CreationDate)[-1].ImageId" --output text
Write-Host "AMI: $AMI_ID"
aws ec2 run-instances --profile $PROFILE_NAME --region $REGION `
  --image-id $AMI_ID --instance-type t3.micro `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hackathon-credit-activity}]' `
  --query "Instances[0].{ID:InstanceId,State:State.Name}" --output table

Write-Host "== 2/3 Bedrock =="
aws bedrock-runtime invoke-model --profile $PROFILE_NAME --region $REGION `
  --model-id amazon.titan-text-lite-v1 `
  --body '{"inputText":"Hello","textGenerationConfig":{"maxTokenCount":20}}' `
  --cli-binary-format raw-in-base64-out output.json
Get-Content output.json

Write-Host "== 3/3 Lambda =="
'def handler(event, context): return {"statusCode": 200, "body": "hello hackathon"}' | Out-File -Encoding utf8 lambda_function.py
Compress-Archive -Path lambda_function.py -DestinationPath lambda.zip -Force
$ROLE_ARN = aws iam create-role --profile $PROFILE_NAME --role-name hackathon-lambda-role `
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' `
  --query "Role.Arn" --output text
aws iam attach-role-policy --profile $PROFILE_NAME --role-name hackathon-lambda-role `
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
Write-Host "Esperando propagacion del rol IAM..."
Start-Sleep -Seconds 10
aws lambda create-function --profile $PROFILE_NAME --region $REGION `
  --function-name hackathon-credit-activity --runtime python3.12 `
  --role $ROLE_ARN --handler lambda_function.handler --zip-file fileb://lambda.zip `
  --query "{Name:FunctionName,State:State}" --output table

Write-Host "Listo. Revisa la pagina de 'Earn AWS credits' en unos minutos."
