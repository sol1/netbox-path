import django.core.serializers.json
from django.db import migrations, models
import taggit.managers

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
                ('description', models.TextField(blank=True)),
                ('graph', models.JSONField(blank=True, null=True)),
                ('custom_field_data', models.JSONField(blank=True, default=dict, encoder=django.core.serializers.json.DjangoJSONEncoder)),
                ('tags', taggit.managers.TaggableManager(through='extras.TaggedItem', to='extras.Tag')),
            ],
        )
    ]