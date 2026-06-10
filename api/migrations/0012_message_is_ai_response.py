from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_catchmentarea_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='is_ai_response',
            field=models.BooleanField(default=False),
        ),
    ]
