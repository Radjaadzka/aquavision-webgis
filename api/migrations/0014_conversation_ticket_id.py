from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_downloadlog_auditlog_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='ticket_id',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AlterField(
            model_name='conversation',
            name='status',
            field=models.CharField(
                choices=[
                    ('open',              'Open'),
                    ('ai_answered',       'Dijawab AI'),
                    ('waiting_admin',     'Menunggu Admin'),
                    ('WAITING_FOR_ADMIN', 'Menunggu Admin (lama)'),
                    ('reviewing',         'Sedang Ditinjau'),
                    ('closed',            'Selesai'),
                ],
                default='open',
                max_length=20,
            ),
        ),
    ]
