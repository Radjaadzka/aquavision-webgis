from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_feedback_rating'),
    ]

    operations = [
        migrations.AlterField(
            model_name='fasilitaswisata',
            name='jenis',
            field=models.CharField(
                choices=[
                    ('hotel', 'Hotel'),
                    ('resto', 'Restoran'),
                    ('homestay', 'Homestay'),
                    ('jasa', 'Jasa'),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='conversation',
            name='status',
            field=models.CharField(
                choices=[
                    ('open', 'Open'),
                    ('ai_answered', 'Dijawab AI'),
                    ('waiting_admin', 'Menunggu Admin'),
                    ('WAITING_FOR_ADMIN', 'Menunggu Admin (lama)'),
                    ('reviewing', 'Sedang Ditinjau'),
                    ('closed', 'Selesai'),
                ],
                db_index=True,
                default='open',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='message',
            name='is_read',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='notification',
            name='is_read',
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
