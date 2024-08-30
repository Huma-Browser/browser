# Hüma Tarayıcısı Workspaces Özelliği Belgelendirmesi

Bu belgelendirme, Hüma adlı Firefox tabanlı açık kaynak tarayıcının 100.0b1 sürümü için geliştirilen Workspaces özelliğini açıklamaktadır. Bu özellik, kullanıcılara farklı çalışma alanları oluşturma ve yönetme imkanı sağlar.

## Genel Bakış

Workspaces özelliği, `HumaWorkspaces` adlı bir JavaScript nesnesi olarak uygulanmıştır. Bu nesne, çalışma alanlarının oluşturulması, değiştirilmesi, silinmesi ve aralarında geçiş yapılması gibi temel işlevleri yönetir. Ayrıca, kullanıcı arayüzü elemanlarını ve etkileşimleri de kontrol eder.

## Temel Fonksiyonlar

### init()

Bu fonksiyon, Workspaces özelliğini başlatır. Tarayıcı penceresi yüklendiğinde çağrılır ve aşağıdaki işlemleri gerçekleştirir:

- Gizli pencerelerde çalışmayı engeller.
- Çalışma alanlarını başlatır.
- Kullanıcı arayüzü elemanlarını oluşturur.

### initializeWorkspaces()

Çalışma alanlarını başlatır ve aşağıdaki işlemleri gerçekleştirir:

- Çalışma alanları düğmesini oluşturur.
- Mevcut çalışma alanlarını yükler.
- Varsayılan çalışma alanını oluşturur (eğer yoksa).
- Kullanıcı arayüzü elemanlarını başlatır.

### changeWorkspace(window, onInit = false)

Belirtilen çalışma alanına geçiş yapar. Bu işlem sırasında:

- Aktif çalışma alanını günceller.
- İlgili sekmeleri gösterir/gizler.
- Kullanıcı arayüzünü günceller.

### createAndSaveWorkspace(name = "New Workspace", isDefault = false, icon = undefined)

Yeni bir çalışma alanı oluşturur ve kaydeder. Bu fonksiyon:

- Yeni çalışma alanı verilerini oluşturur.
- Çalışma alanını kaydeder.
- Yeni oluşturulan çalışma alanına geçiş yapar.

### saveWorkspace(workspaceData)

Bir çalışma alanının verilerini kaydeder. Bu işlem:

- Mevcut çalışma alanları verilerini okur.
- Yeni veya güncellenmiş çalışma alanı verilerini ekler/günceller.
- Değişiklikleri dosyaya yazar.

### removeWorkspace(windowID)

Belirtilen çalışma alanını siler. Bu fonksiyon:

- Çalışma alanını verilerden kaldırır.
- İlgili sekmeleri siler.
- Kullanıcı arayüzünü günceller.

## Kullanıcı Arayüzü Fonksiyonları

### openWorkspacesDialog(event)

Çalışma alanları panelini açar. Bu panel:

- Mevcut çalışma alanlarını listeler.
- Yeni çalışma alanı oluşturma seçeneği sunar.
- Çalışma alanları arasında geçiş yapma imkanı sağlar.

### openSaveDialog()

Yeni çalışma alanı oluşturma diyaloğunu açar. Bu diyalog:

- Çalışma alanı adı girişi sağlar.
- İkon seçme imkanı sunar.

### openEditDialog(workspaceUuid)

Mevcut bir çalışma alanını düzenleme diyaloğunu açar. Bu diyalog:

- Çalışma alanı adını değiştirme imkanı sağlar.
- İkon değiştirme seçeneği sunar.

### _updateWorkspacesButton()

Çalışma alanları düğmesini günceller. Bu işlem:

- Aktif çalışma alanının adını ve ikonunu gösterir.

## Bağlam Menüsü Fonksiyonları

### updateContextMenu(_)

Çalışma alanı bağlam menüsünü günceller. Bu menü:

- Çalışma alanını açma seçeneği sunar.
- Varsayılan çalışma alanı olarak ayarlama imkanı sağlar.
- Çalışma alanını düzenleme ve silme seçenekleri sunar.

### setDefaultWorkspace()

Seçilen çalışma alanını varsayılan olarak ayarlar.

### contextDelete(event)

Seçilen çalışma alanını siler.

### contextEdit(event)

Seçilen çalışma alanını düzenleme diyaloğunu açar.

## Sekme Yönetimi Fonksiyonları

### handleTabClose(event)

Bir sekme kapatıldığında çağrılır ve:

- Eğer kapanan sekme bir çalışma alanındaki son sekmeyse, yeni bir sekme açar.
- Çalışma alanındaki diğer sekmeleri kapatır.

### changeTabWorkspace(workspaceID)

Seçilen sekmeleri belirtilen çalışma alanına taşır.

## Sonuç

Bu belgelendirme, Hüma tarayıcısının Workspaces özelliğinin temel işlevlerini ve kullanıcı arayüzü etkileşimlerini açıklamaktadır. Bu özellik, kullanıcılara farklı görevler veya projeler için ayrı çalışma alanları oluşturma ve yönetme imkanı sağlayarak, tarayıcı deneyimini daha organize ve verimli hale getirmeyi amaçlamaktadır.