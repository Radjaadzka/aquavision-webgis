from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_conversation_ticket_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='rating',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
