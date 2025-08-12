// Šeit definējam Subcategory tipu
export interface Subcategory {
  id?: string; // Neobligāts, jo jaunu var pievienot bez ID
  category_id?: string; // Neobligāts, jo to var pievienot vēlāk
  name: string;
  slug: string;
  url: string;
  icon: string;
  meta_title: string;
  meta_description: string;
  order_index: number;
  is_active: boolean;
}

// Šeit definējam Category tipu, kas atbilst abiem failiem
export interface Category {
  id: string; // Pieņemam, ka no API vienmēr nāk ar ID
  name: string;
  slug: string;
  url: string;
  meta_title?: string;
  meta_description?: string;
  order_index: number;
  is_active: boolean;
  // Šis lauks tiek pievienots lokāli NavigationAdminPage
  subitems?: Subcategory[]; 
}
