import type { AppData, Category, Location, Subcategory, Unit } from "./types";

const now = new Date().toISOString();

export const defaultCategories: Category[] = [
  "Jarðvinna",
  "Burðarvirki",
  "Lagnakerfi",
  "Rafkerfi",
  "Innanhúsfrágangur",
  "Laus búnaður",
  "Utanhúsfrágangur",
  "Lóðarfrágangur",
  "Ófyrirséð"
].map((name, index) => ({
  id: `cat_${index + 1}`,
  name,
  sort_order: index + 1,
  is_default: true,
  is_active: true,
  created_at: now,
  updated_at: now
}));

const subcategoryGroups: Record<string, string[]> = {
  cat_1: ["Bílastæði", "Aðstaða", "Jarðvinna"],
  cat_2: ["Uppsteypa"],
  cat_3: ["Pípulögn", "Loftræsting", "Hreinlætistæki"],
  cat_4: ["Rafmagn", "Lyfta"],
  cat_5: ["Flotun", "Múrverk", "Gipsveggir", "Málun", "Flísalögn", "Innréttingar", "Rafmagn", "Innihurðar", "Sólbekkir", "Frágangur", "Þrif"],
  cat_6: ["Laus búnaður", "Annað"],
  cat_7: ["Einangrun", "Klæðning", "Múrverk út", "Gluggar", "Gler", "Þakfrágangur", "Svalahandrið"],
  cat_8: ["Lóðarfrágangur"],
  cat_9: ["Ófyrirséð"]
};

export const defaultSubcategories: Subcategory[] = Object.entries(subcategoryGroups).flatMap(([categoryId, names]) =>
  names.map((name, index) => ({
    id: `sub_${categoryId}_${index + 1}`,
    category_id: categoryId,
    name,
    sort_order: index + 1,
    is_default: true,
    is_active: true,
    created_at: now,
    updated_at: now
  }))
);

const bryggjuhverfiLocations = [
  {
    id: "location_1",
    name: "Buðlabryggja 29-31",
    units: ["0101", "0102", "0103", "0104", "0105", "0106", "0107", "0108", "0109", "0201", "0202", "0203", "0204", "0205", "0206", "0207", "0208", "0209", "0301", "0302", "0303", "0304", "0305", "0306", "0307", "0308", "0309"]
  },
  {
    id: "location_2",
    name: "Endilsbryggja 24",
    units: ["0110", "0111", "0112", "0113", "0114", "0115", "0116", "0210", "0211", "0212", "0213", "0214", "0215", "0216", "0310", "0311", "0312", "0313", "0314", "0315", "0316", "0401", "0402", "0403", "0404", "0405"]
  },
  {
    id: "location_3",
    name: "Gjúkabryggja 10-12",
    units: ["0117", "0118", "0119", "0120", "0121", "0122", "0123", "0124", "0125", "0217", "0218", "0219", "0220", "0221", "0222", "0223", "0224", "0225", "0317", "0318", "0319", "0320", "0321", "0322", "0323", "0324", "0325"]
  },
  {
    id: "location_4",
    name: "Buðlabryggja 25-27",
    units: ["0126", "0127", "0128", "0129", "0130", "0131", "0132", "0226", "0227", "0228", "0229", "0230", "0231", "0232", "0233", "0326", "0327", "0328", "0329", "0330", "0331", "0332", "0333"]
  }
];

const vorbrautLocations = [
  {
    id: "location_vorbraut_16",
    name: "Vorbraut 16",
    units: ["0101", "0102", "0103", "0104", "0201", "0202", "0203", "0204", "0301", "0302", "0303", "0304", "0401", "0402"]
  }
];

const projectLocationGroups = [
  { projectId: "project_1", locations: bryggjuhverfiLocations },
  { projectId: "project_vorbraut", locations: vorbrautLocations }
];

const locations: Location[] = projectLocationGroups.flatMap((group) => group.locations.map((location, index) => ({
  id: location.id,
  project_id: group.projectId,
  name: location.name,
  description: "",
  sort_order: index + 1,
  created_at: now,
  updated_at: now
})));

const units: Unit[] = projectLocationGroups.flatMap((group) => group.locations.flatMap((location) =>
  location.units.map((unitNumber, index) => ({
    id: `unit_${location.id.replace("location_", "")}_${unitNumber}`,
    project_id: group.projectId,
    location_id: location.id,
    name: `Íbúð ${unitNumber}`,
    unit_type: "apartment",
    floor: `${Number(unitNumber.slice(0, 2))}. hæð`,
    sort_order: index + 1,
    created_at: now,
    updated_at: now
  }))
));

export const initialData: AppData = {
  companies: [{ id: "company_1", name: "Bryggjuhverfi", created_at: now }],
  profiles: [
    { id: "user_admin", name: "Admin", email: "admin@bryggjuhverfi.is", phone: "", work_scope: "Kerfisstjórnun", employer: "Bryggjuhverfi", role: "admin", company_id: "company_1", created_at: now, updated_at: now },
    { id: "user_manager", name: "Verkstjóri", email: "verkstjori@bryggjuhverfi.is", phone: "", work_scope: "Verkstjórn og úthlutun", employer: "Bryggjuhverfi", role: "manager", company_id: "company_1", created_at: now, updated_at: now },
    { id: "user_worker", name: "Starfsmaður", email: "starfsmadur@bryggjuhverfi.is", phone: "", work_scope: "Almenn verk", employer: "Bryggjuhverfi", role: "worker", company_id: "company_1", created_at: now, updated_at: now }
  ],
  projects: [
    { id: "project_1", company_id: "company_1", project_number: "010", name: "Bryggjuhverfi", full_name: "010 - Bryggjuhverfi", status: "active", created_at: now, updated_at: now },
    { id: "project_vorbraut", company_id: "company_1", project_number: "020", name: "Vorbraut", full_name: "020 - Vorbraut", status: "active", created_at: now, updated_at: now }
  ],
  locations,
  units,
  categories: defaultCategories,
  subcategories: defaultSubcategories,
  unit_categories: [],
  unit_subcategories: [],
  tasks: [],
  task_images: [],
  task_comments: [],
  task_status_history: [],
  task_activity_log: []
};

initialData.units.forEach((unit) => {
  defaultCategories.forEach((category) => {
    initialData.unit_categories.push({ id: `uc_${unit.id}_${category.id}`, unit_id: unit.id, category_id: category.id, sort_order: category.sort_order, created_at: now });
  });

  defaultSubcategories.forEach((subcategory) => {
    initialData.unit_subcategories.push({
      id: `us_${unit.id}_${subcategory.id}`,
      unit_id: unit.id,
      category_id: subcategory.category_id,
      subcategory_id: subcategory.id,
      sort_order: subcategory.sort_order,
      created_at: now
    });
  });
});
