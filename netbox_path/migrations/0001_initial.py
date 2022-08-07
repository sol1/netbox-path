from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    operations = [
        migrations.CreateModel(
            name='Path',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('created', models.DateField(auto_now_add=True, null=True)),
                ('last_updated', models.DateTimeField(auto_now=True, null=True)),
                ('name', models.CharField(max_length=64)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('data', models.JSONField(blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
        )
    ]