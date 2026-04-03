export const Service = {
    methods: {
        async uploadImage(e, file_name, { maxSizeMb = 8, fieldName = 'image' } = {}) {
            const file =
                (e && typeof e === 'object' && 'size' in e && 'name' in e)
                    ? e
                    : e?.target?.files?.[0];

            if (!file) return;

            const maxBytes = maxSizeMb * 1024 * 1024;

            if (file.size > maxBytes) {
                alert(`Размер файла не должен превышать ${maxSizeMb}MB`);
                return;
            }

            const formData = new FormData();

            formData.append(fieldName, file);
            formData.append('action', 'upload_' + file_name);

            try {
                const response = await fetch('../api.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                if (response.ok) {
                    return await response.json();
                } else {
                    const errorData = await response.json();
                    alert('Ошибка загрузки изображения: ' + (errorData.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Ошибка загрузки изображения');
            }
        }
    }
}