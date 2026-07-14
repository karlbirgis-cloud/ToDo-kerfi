import type { AppData, Category, InspectionChecklistItem, InspectionTemplate, InspectionType, Location, Subcategory, Unit } from "./types";

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
  cat_7: ["Einangrun", "Klæðning", "Múrverk út", "Gluggar", "Gler", "Þakfrágangur", "Svalahandrið", "Svalarhurð"],
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

export const defaultInspectionTypes: InspectionType[] = [
  { id: "inspection_type_1", name: "Öryggisúttekt" },
  { id: "inspection_type_final_delivery", name: "Loka skoðun fyrir afhendingu" },
  { id: "inspection_type_3", name: "Afhending" }
].map((inspectionType, index) => ({
  ...inspectionType,
  sort_order: index + 1,
  is_active: true,
  created_at: now,
  updated_at: now
}));

export const finalDeliveryTemplate: InspectionTemplate = {
  id: "inspection_template_final_delivery",
  inspection_type_id: "inspection_type_final_delivery",
  name: "Loka skoðun fyrir afhendingu",
  is_active: true,
  created_at: now,
  updated_at: now
};

const finalDeliveryChecklistSource = [
  ["ANDYRI", "Útihurð", "Yfirborð hurðar, karms og þröskuldar er í lagi", "cat_5", "sub_cat_5_8"],
  ["ANDYRI", "Skápar", "Yfirborð, bæði hurða og hliða er í lagi og allar hillur til staðar", "cat_5", "sub_cat_5_6"],
  ["ANDYRI", "Pípulagnir", "Allir ofnar virka og eru í lagi", "cat_3", "sub_cat_3_1"],
  ["ANDYRI", "Málning", "Áferð veggja og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["ANDYRI", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["ANDYRI", "Slökkvitæki", "Er slökkvitæki til staðar í íbúðinni og uppsett.", "cat_6", "sub_cat_6_1"],
  ["Almennt", "Hvítar skelli bólur", "Eru komnar hvítar skelli bólur á alla veggi bakvið hurðarhúna", "cat_5", "sub_cat_5_10"],
  ["ELDHÚS", "Innréttingar", "Yfirborð, bæði hurða og hliða er í lagi og allar hillur til staðar.", "cat_5", "sub_cat_5_6"],
  ["ELDHÚS", "Borðplata", "Yfirborð borðplötu og frágangur hennar er í lagi", "cat_5", "sub_cat_5_6"],
  ["ELDHÚS", "Eldavél", "Eldavél tengd og útlitsgallar ekki sjáanlegir", "cat_6", "sub_cat_6_1"],
  ["ELDHÚS", "Helluborð", "Helluborð tengt og útlitsgallar ekki sjáanlegir", "cat_6", "sub_cat_6_1"],
  ["ELDHÚS", "Háfur", "Háfur tengdur og útlitsgallar ekki sjáanlegir", "cat_6", "sub_cat_6_1"],
  ["ELDHÚS", "Loftljós", "Loftljós tengd og virka", "cat_4", "sub_cat_4_1"],
  ["ELDHÚS", "Vaskur", "Vaskur er tengdur og útlitsgallar ekki sjáanlegir", "cat_3", "sub_cat_3_3"],
  ["ELDHÚS", "Blöndunartæki", "Blöndunartæki eru tengd og tengingar frárennslis í lagi.", "cat_3", "sub_cat_3_3"],
  ["ELDHÚS", "Uppþvottavél", "Vatnsinntak fyrir uppþvottavél í lagi.", "cat_3", "sub_cat_3_1"],
  ["ELDHÚS", "Málning", "Málning veggja og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["ELDHÚS", "Lökkun glugga", "Lökkun glugga í lagi", "cat_5", "sub_cat_5_10"],
  ["ELDHÚS", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["STOFA", "Svalahurð", "Læsing og lamir á svalahurð eru í lagi og á henni hurðarpumpa.", "cat_7", "sub_cat_7_8"],
  ["STOFA", "Málning", "Málning veggja og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["STOFA", "Lökkun glugga", "Lökkun glugga í lagi", "cat_5", "sub_cat_5_10"],
  ["STOFA", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["STOFA", "Opnanleg fög", "Lokun er í lagi.", "cat_7", "sub_cat_7_4"],
  ["STOFA", "Reykskynjari", "Er reykskynjari til staðar.", "cat_6", "sub_cat_6_1"],
  ["BAÐHERBERGI", "Gólfflísar", "Flísar heilar og fúgur í lagi.", "cat_5", "sub_cat_5_5"],
  ["BAÐHERBERGI", "Niðurfall", "Vatnshalli réttur að gólfniðurfalli, niðurfallið hreint og ristin til staðar.", "cat_3", "sub_cat_3_1"],
  ["BAÐHERBERGI", "Veggflísar", "Flísar heilar og fúgur í lagi.", "cat_5", "sub_cat_5_5"],
  ["BAÐHERBERGI", "Innrétting", "Yfirborð innréttingar og frágangur hennar er í lagi.", "cat_5", "sub_cat_5_6"],
  ["BAÐHERBERGI", "Spegill", "Spegill er í lagi", "cat_6", "sub_cat_6_1"],
  ["BAÐHERBERGI", "Sturtugler", "Yfirborð sturtuglers og frágangur þess er í lagi.", "cat_5", "sub_cat_5_10"],
  ["BAÐHERBERGI", "Vaskur", "Vaskur uppsettur, blöndunartæki virka og tengingar frárennslis í lagi.", "cat_3", "sub_cat_3_3"],
  ["BAÐHERBERGI", "Sturta", "Sturta uppsett, blöndunartæki virka og tengingar frárennslis í lagi.", "cat_3", "sub_cat_3_3"],
  ["BAÐHERBERGI", "Salerni", "Salerni uppsett og tengt og tengingar frárennslis í lagi", "cat_3", "sub_cat_3_3"],
  ["BAÐHERBERGI", "Innihurð", "Yfirborð hurðar og karms er í lagi.", "cat_5", "sub_cat_5_8"],
  ["BAÐHERBERGI", "Málning", "Málning veggja fyrir ofan flísar og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["BAÐHERBERGI", "Loftræsting", "Loftræstitúða uppsett og útsog komið í gang.", "cat_3", "sub_cat_3_2"],
  ["BAÐHERBERGI", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["HERBERGI", "Fataskápar", "Yfirborð, bæði hurða og hliða er í lagi og allar hillur til staðar.", "cat_5", "sub_cat_5_6"],
  ["HERBERGI", "Innihurðir", "Yfirborð hurða og karma er í lagi.", "cat_5", "sub_cat_5_8"],
  ["HERBERGI", "Málning", "Málning veggja og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["HERBERGI", "Lökkun glugga", "Lökkun glugga í lagi", "cat_5", "sub_cat_5_10"],
  ["HERBERGI", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["HERBERGI", "Opnanleg fög", "Lokun er í lagi.", "cat_7", "sub_cat_7_4"],
  ["ÞVOTTAHÚS", "Gólfflísar", "Flísar heilar og fúgur í lagi", "cat_5", "sub_cat_5_5"],
  ["ÞVOTTAHÚS", "Niðurfall", "Vatnshalli réttur að gólfniðurfalli, niðurfallið hreint og ristin til staðar.", "cat_3", "sub_cat_3_1"],
  ["ÞVOTTAHÚS", "Þvottavél", "Vatnsinntak og frárennsli fyrir þvottavél í lagi.", "cat_3", "sub_cat_3_1"],
  ["ÞVOTTAHÚS", "Innihurð", "Áferð hurðar og karms er í lagi.", "cat_5", "sub_cat_5_8"],
  ["ÞVOTTAHÚS", "Málning", "Málning veggja og lofta er í lagi.", "cat_5", "sub_cat_5_4"],
  ["ÞVOTTAHÚS", "Loftræsting", "Loftræstitúða uppsett og útsog komið í gang.", "cat_3", "sub_cat_3_2"],
  ["ÞVOTTAHÚS", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["ÞVOTTAHÚS", "Loftljós", "Loftljós tengd og virka", "cat_4", "sub_cat_4_1"],
  ["ÞVOTTAHÚS", "Rafmagnstafla", "Frágangur rafmagnstöflu í lagi", "cat_4", "sub_cat_4_1"],
  ["SVALIR", "Svalagólf", "Áferð svalagólfs er í lagi", "cat_7", "sub_cat_7_7"],
  ["SVALIR", "Niðurfall", "Vatnshalli réttur að gólfniðurfalli, niðurfallið hreint og ristin til staðar.", "cat_3", "sub_cat_3_1"],
  ["SVALIR", "Svalahandrið", "Frágangur svalahandriðs er í lagi.", "cat_7", "sub_cat_7_7"],
  ["GEYMSLA OG SAMEIGN", "Geymsluhurð", "Áferð hurða, karma og þröskulda er í lagi.", "cat_5", "sub_cat_5_8"],
  ["GEYMSLA OG SAMEIGN", "Almennur frágangur", "Almennur frágangur í samræmi við skilmála kaupsamnings.", "cat_5", "sub_cat_5_10"],
  ["GEYMSLA OG SAMEIGN", "Rafmagn", "Allir rofar og tenglar tengdir og virka", "cat_4", "sub_cat_4_1"],
  ["GEYMSLA OG SAMEIGN", "Loftljós", "Loftljós tengd og virka", "cat_4", "sub_cat_4_1"],
  ["SVALIR", "Svalarloft", "Áferð svalarlofts er í lagi.", "cat_7", "sub_cat_7_7"]
] as const;

export const finalDeliveryChecklistItems: InspectionChecklistItem[] = finalDeliveryChecklistSource.map((item, index) => ({
  id: `inspection_item_final_delivery_${index + 1}`,
  template_id: finalDeliveryTemplate.id,
  section: item[0],
  title: item[1],
  description: item[2],
  category_id: item[3],
  subcategory_id: item[4],
  sort_order: index + 1,
  created_at: now,
  updated_at: now
}));

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
  responsible_parties: [
    { id: "responsible_1", name: "Bryggjuhverfi", email: "", phone: "", created_at: now, updated_at: now }
  ],
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
  inspection_types: defaultInspectionTypes,
  inspection_templates: [finalDeliveryTemplate],
  inspection_checklist_items: finalDeliveryChecklistItems,
  inspection_runs: [],
  inspection_run_items: [],
  subcategories: defaultSubcategories,
  unit_categories: [],
  unit_subcategories: [],
  tasks: [],
  task_images: [],
  floor_plans: [],
  task_plan_markers: [],
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
