/**
 * ACAF Data Module
 * Manages all data via localStorage for the ACAF Monitoring system.
 * Provides CRUD operations for incidents, countries, institutions, and taxonomy types.
 */
const ACAF = (function () {
    'use strict';

    const KEYS = {
        INCIDENTS: 'acaf_incidents',
        COUNTRIES: 'acaf_countries',
        INSTITUTIONS: 'acaf_institutions',
        INCIDENT_TYPES: 'acaf_incident_types',
        DISCRIMINATION_TYPES: 'acaf_discrimination_types',
        SESSION: 'acaf_admin_session',
        INITIALIZED: 'acaf_initialized'
    };

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    function getAll(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('ACAF: Error reading localStorage key "' + key + '":', e);
            return [];
        }
    }

    function setAll(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('ACAF: Error writing localStorage key "' + key + '":', e);
        }
    }

    // ─── Countries ───────────────────────────────────────────────────────────────
    function getCountries() { return getAll(KEYS.COUNTRIES); }
    function saveCountries(data) { setAll(KEYS.COUNTRIES, data); }

    function addCountry(name, region) {
        const countries = getCountries();
        const country = { id: generateId(), name: name.trim(), region };
        countries.push(country);
        countries.sort((a, b) => a.name.localeCompare(b.name));
        saveCountries(countries);
        return country;
    }

    function updateCountry(id, name, region) {
        const countries = getCountries().map(c =>
            c.id === id ? { ...c, name: name.trim(), region } : c
        );
        countries.sort((a, b) => a.name.localeCompare(b.name));
        saveCountries(countries);
    }

    function deleteCountry(id) {
        saveCountries(getCountries().filter(c => c.id !== id));
    }

    // ─── Institutions ─────────────────────────────────────────────────────────────
    function getInstitutions() { return getAll(KEYS.INSTITUTIONS); }
    function saveInstitutions(data) { setAll(KEYS.INSTITUTIONS, data); }

    function addInstitution(name, country, abbreviation) {
        const institutions = getInstitutions();
        const inst = { id: generateId(), name: name.trim(), country, abbreviation: (abbreviation || '').trim() };
        institutions.push(inst);
        saveInstitutions(institutions);
        return inst;
    }

    function updateInstitution(id, name, country, abbreviation) {
        const institutions = getInstitutions().map(i =>
            i.id === id ? { ...i, name: name.trim(), country, abbreviation: (abbreviation || '').trim() } : i
        );
        saveInstitutions(institutions);
    }

    function deleteInstitution(id) {
        saveInstitutions(getInstitutions().filter(i => i.id !== id));
    }

    function getInstitutionsByCountries(countryNames) {
        if (!countryNames || countryNames.length === 0) return getInstitutions();
        return getInstitutions().filter(i => countryNames.includes(i.country));
    }

    // ─── Incident Types ───────────────────────────────────────────────────────────
    function getIncidentTypes() { return getAll(KEYS.INCIDENT_TYPES); }
    function saveIncidentTypes(data) { setAll(KEYS.INCIDENT_TYPES, data); }

    function addIncidentType(name) {
        const types = getIncidentTypes();
        const type = { id: generateId(), name: name.trim() };
        types.push(type);
        saveIncidentTypes(types);
        return type;
    }

    function updateIncidentType(id, name) {
        saveIncidentTypes(getIncidentTypes().map(t => t.id === id ? { ...t, name: name.trim() } : t));
    }

    function deleteIncidentType(id) {
        saveIncidentTypes(getIncidentTypes().filter(t => t.id !== id));
    }

    // ─── Discrimination Types ─────────────────────────────────────────────────────
    function getDiscriminationTypes() { return getAll(KEYS.DISCRIMINATION_TYPES); }
    function saveDiscriminationTypes(data) { setAll(KEYS.DISCRIMINATION_TYPES, data); }

    function addDiscriminationType(name) {
        const types = getDiscriminationTypes();
        const type = { id: generateId(), name: name.trim() };
        types.push(type);
        saveDiscriminationTypes(types);
        return type;
    }

    function updateDiscriminationType(id, name) {
        saveDiscriminationTypes(getDiscriminationTypes().map(t => t.id === id ? { ...t, name: name.trim() } : t));
    }

    function deleteDiscriminationType(id) {
        saveDiscriminationTypes(getDiscriminationTypes().filter(t => t.id !== id));
    }

    // ─── Incidents ────────────────────────────────────────────────────────────────
    function getIncidents() { return getAll(KEYS.INCIDENTS); }
    function saveIncidents(data) { setAll(KEYS.INCIDENTS, data); }
    function getIncidentById(id) { return getIncidents().find(i => i.id === id) || null; }

    function addIncident(incident) {
        const incidents = getIncidents();
        const now = new Date().toISOString();
        const newIncident = { ...incident, id: generateId(), createdAt: now, updatedAt: now };
        incidents.unshift(newIncident);
        saveIncidents(incidents);
        return newIncident;
    }

    function updateIncident(id, data) {
        let updated = null;
        const incidents = getIncidents().map(i => {
            if (i.id === id) {
                updated = { ...i, ...data, id, updatedAt: new Date().toISOString() };
                return updated;
            }
            return i;
        });
        saveIncidents(incidents);
        return updated;
    }

    function deleteIncident(id) {
        saveIncidents(getIncidents().filter(i => i.id !== id));
    }

    // ─── Authentication ───────────────────────────────────────────────────────────
    function login(username, password) {
        if (username === 'admin' && password === 'acaf2024') {
            const session = { token: generateId(), loginAt: new Date().toISOString(), user: 'admin' };
            localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
            return true;
        }
        return false;
    }

    function isLoggedIn() {
        return !!localStorage.getItem(KEYS.SESSION);
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.SESSION));
        } catch { return null; }
    }

    function logout() {
        localStorage.removeItem(KEYS.SESSION);
    }

    function requireAuth(redirectTo) {
        if (!isLoggedIn()) {
            window.location.href = redirectTo || 'admin.html';
            return false;
        }
        return true;
    }

    // ─── Seed / Initialize ────────────────────────────────────────────────────────
    function initialize() {
        if (localStorage.getItem(KEYS.INITIALIZED)) return;

        const regions = {
            'Central Africa': [
                'Angola', 'Cameroon', 'Central African Republic', 'Chad',
                'Democratic Republic of the Congo', 'Republic of the Congo',
                'Equatorial Guinea', 'Gabon', 'Sao Tome and Principe'
            ],
            'East Africa': [
                'Burundi', 'Comoros', 'Djibouti', 'Eritrea', 'Ethiopia',
                'Kenya', 'Madagascar', 'Malawi', 'Mauritius', 'Mozambique',
                'Rwanda', 'Seychelles', 'Somalia', 'South Sudan', 'Tanzania',
                'Uganda', 'Zambia', 'Zimbabwe'
            ],
            'North Africa': [
                'Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia', 'Western Sahara'
            ],
            'Southern Africa': [
                'Botswana', 'Eswatini', 'Lesotho', 'Namibia', 'South Africa'
            ],
            'West Africa': [
                'Benin', 'Burkina Faso', 'Cabo Verde', "C\u00f4te d'Ivoire",
                'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Liberia',
                'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Senegal', 'Sierra Leone', 'Togo'
            ]
        };

        const countries = [];
        for (const [region, list] of Object.entries(regions)) {
            list.forEach(name => countries.push({ id: generateId(), name, region }));
        }
        saveCountries(countries);

        const institutionData = [
            { name: 'University of Ghana', country: 'Ghana', abbreviation: 'UG' },
            { name: 'Kwame Nkrumah University of Science & Technology', country: 'Ghana', abbreviation: 'KNUST' },
            { name: 'University of Cape Coast', country: 'Ghana', abbreviation: 'UCC' },
            { name: 'University of Education, Winneba', country: 'Ghana', abbreviation: 'UEW' },
            { name: 'Technical University of Kenya', country: 'Kenya', abbreviation: 'TUK' },
            { name: 'Moi University', country: 'Kenya', abbreviation: 'MU' },
            { name: 'University of Nairobi', country: 'Kenya', abbreviation: 'UoN' },
            { name: 'Kenyatta University', country: 'Kenya', abbreviation: 'KU' },
            { name: 'University of Lagos', country: 'Nigeria', abbreviation: 'UNILAG' },
            { name: 'Ahmadu Bello University', country: 'Nigeria', abbreviation: 'ABU' },
            { name: 'Obafemi Awolowo University', country: 'Nigeria', abbreviation: 'OAU' },
            { name: 'University of Ibadan', country: 'Nigeria', abbreviation: 'UI' },
            { name: 'University of Cape Town', country: 'South Africa', abbreviation: 'UCT' },
            { name: 'University of the Witwatersrand', country: 'South Africa', abbreviation: 'Wits' },
            { name: 'Stellenbosch University', country: 'South Africa', abbreviation: 'SU' },
            { name: 'University of Pretoria', country: 'South Africa', abbreviation: 'UP' },
            { name: 'Cairo University', country: 'Egypt', abbreviation: 'CU' },
            { name: 'Alexandria University', country: 'Egypt', abbreviation: 'AlexU' },
            { name: 'Makerere University', country: 'Uganda', abbreviation: 'MakUni' },
            { name: 'Gulu University', country: 'Uganda', abbreviation: 'GU' },
            { name: 'University of Dar es Salaam', country: 'Tanzania', abbreviation: 'UDSM' },
            { name: 'Muhimbili University of Health and Allied Sciences', country: 'Tanzania', abbreviation: 'MUHAS' },
            { name: 'Addis Ababa University', country: 'Ethiopia', abbreviation: 'AAU' },
            { name: 'Jimma University', country: 'Ethiopia', abbreviation: 'JU' },
            { name: 'University of Khartoum', country: 'Sudan', abbreviation: 'UoK' },
            { name: "Cheikh Anta Diop University", country: 'Senegal', abbreviation: 'UCAD' },
            { name: 'University of Zimbabwe', country: 'Zimbabwe', abbreviation: 'UZ' },
            { name: 'University of Zambia', country: 'Zambia', abbreviation: 'UNZA' },
            { name: 'University of Rwanda', country: 'Rwanda', abbreviation: 'UR' },
            { name: 'University of Cameroon', country: 'Cameroon', abbreviation: 'UC' },
        ];
        saveInstitutions(institutionData.map(i => ({ ...i, id: generateId() })));

        const incidentTypeNames = [
            'Activities of Non-State Actors', 'Biased Internationalisation',
            'Conflict/ Political Instability', 'Controlled Research',
            'Demotion/ Loss of Position', 'Imprisonment',
            'Killings/ Violence/ Disappearances', 'Poor Infrastructure/Facilities/ Equipment',
            'Poor University Governance', 'Poor Working conditions', 'Prosecution',
            'Student Abuse', 'Travel Restrictions'
        ];
        saveIncidentTypes(incidentTypeNames.map(name => ({ id: generateId(), name })));

        const discTypeNames = ['Racial', 'Nationality', 'Religious', 'Gender', 'Other', 'None'];
        saveDiscriminationTypes(discTypeNames.map(name => ({ id: generateId(), name })));

        // Seed sample incidents
        const now = new Date().toISOString();
        const samples = [
            {
                title: 'Professor Detained Following Publication of Governance Research',
                description: 'Dr. Kofi Mensah, a political science professor, was detained by state security forces following the publication of a report exposing financial irregularities in public university funding. The professor was held for 72 hours without formal charges before being released following pressure from international academic freedom organisations. The incident has raised serious concerns about the ability of academics to engage in critical research without fear of reprisal.',
                date: '2024-03-15', country: 'Ghana', institution: 'University of Ghana', city: 'Accra',
                incidentTypes: ['Imprisonment', 'Prosecution'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Student Leaders Arrested During Peaceful Campus Protest',
                description: 'Twelve student leaders were arrested by police following a peaceful campus demonstration against new tuition fee increases. The students were demanding a reversal of the 30% fee hike announced by the university administration. Three students required medical attention after the police dispersal. International student bodies condemned the action as a violation of the right to peaceful assembly.',
                date: '2024-01-22', country: 'Uganda', institution: 'Makerere University', city: 'Kampala',
                incidentTypes: ['Student Abuse', 'Imprisonment'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Academic Barred from Travel After Co-signing Open Letter',
                description: 'A sociology lecturer was prevented from traveling to attend an international conference after authorities confiscated her passport. The action came weeks after she co-signed an open letter criticizing restrictions on academic discourse at Egyptian universities. The passport was held for over four months without explanation. The incident drew a statement of concern from the African Commission on Human and Peoples\u2019 Rights.',
                date: '2023-11-08', country: 'Egypt', institution: 'Cairo University', city: 'Cairo',
                incidentTypes: ['Travel Restrictions'], discriminationTypes: ['Gender'], source: '', documents: []
            },
            {
                title: 'Lecturer Dismissed for Media Interview Critical of Federal Policy',
                description: 'An economics lecturer was summarily dismissed following a media interview in which he criticized the federal government\'s agricultural subsidies policy. The university cited "bringing the institution into disrepute" as grounds for dismissal. The lecturer filed an appeal with the National Industrial Court, which granted an interim order of reinstatement pending the hearing.',
                date: '2023-09-14', country: 'Nigeria', institution: 'Ahmadu Bello University', city: 'Zaria',
                incidentTypes: ['Demotion/ Loss of Position'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Research Laboratories Destroyed During Civil Conflict',
                description: 'Three research laboratories were destroyed during clashes between security forces and opposition groups near the university campus. Years of irreplaceable climate and marine biology research data was lost, and two research assistants sustained injuries during the incident. The estimated cost of damage to scientific equipment and data exceeds $2 million USD.',
                date: '2023-07-03', country: 'Tanzania', institution: 'University of Dar es Salaam', city: 'Dar es Salaam',
                incidentTypes: ['Conflict/ Political Instability', 'Poor Infrastructure/Facilities/ Equipment'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Foreign Academics Denied Entry for Research Exchange Program',
                description: 'Five European academics invited to participate in a two-week research exchange program were denied entry visas without explanation by immigration authorities. The academics were scheduled to conduct workshops on environmental policy and co-supervise postgraduate students. The incident has been flagged by the university as a potential case of politically-motivated visa denial.',
                date: '2024-05-20', country: 'South Africa', institution: 'University of Cape Town', city: 'Cape Town',
                incidentTypes: ['Biased Internationalisation', 'Travel Restrictions'], discriminationTypes: ['Nationality'], source: '', documents: []
            },
            {
                title: 'Journalist-Lecturer Charged Under Sedition Laws',
                description: 'A media studies lecturer who also works as a journalist was charged under national sedition laws after publishing an investigative piece on alleged corruption involving senior government officials. The case drew international condemnation from press freedom organisations including Reporters Without Borders. The lecturer was acquitted after an eighteen-month trial, but was subsequently denied contract renewal by the university.',
                date: '2022-12-01', country: 'Senegal', institution: 'Cheikh Anta Diop University', city: 'Dakar',
                incidentTypes: ['Prosecution', 'Controlled Research'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Deteriorating Infrastructure Halts Key Research Programs',
                description: 'Inadequate funding and deteriorating laboratory equipment has severely impacted ongoing research programs. Faculty members report that core scientific equipment remains non-functional for months at a time due to lack of maintenance budgets. Several doctoral students have had to suspend or abandon their research programs as a direct result of the infrastructure failure.',
                date: '2024-02-10', country: 'Ghana', institution: 'Kwame Nkrumah University of Science & Technology', city: 'Kumasi',
                incidentTypes: ['Poor Infrastructure/Facilities/ Equipment', 'Poor Working conditions'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Academic Killed During Post-Election Violence on Campus',
                description: 'A senior lecturer in the Faculty of Law was killed when armed groups entered the university campus during post-election violence. Three other faculty members were injured. The university was forced to suspend classes for three weeks. International human rights organisations demanded an independent investigation into the events.',
                date: '2022-08-15', country: 'Kenya', institution: 'University of Nairobi', city: 'Nairobi',
                incidentTypes: ['Killings/ Violence/ Disappearances', 'Conflict/ Political Instability'], discriminationTypes: ['None'], source: '', documents: []
            },
            {
                title: 'Research Funding Conditioned on Government-Approved Topics',
                description: 'The Ministry of Education issued a directive requiring all university research proposals to be pre-approved by a newly established government committee before receiving state funding. The directive effectively restricts academic inquiry on political, social justice, and governance topics. A coalition of university rectors protested the directive as an unconstitutional interference with institutional autonomy.',
                date: '2023-04-20', country: 'Ethiopia', institution: 'Addis Ababa University', city: 'Addis Ababa',
                incidentTypes: ['Controlled Research', 'Poor University Governance'], discriminationTypes: ['None'], source: '', documents: []
            }
        ];

        const seedIncidents = samples.map(s => ({
            ...s,
            id: generateId(),
            createdAt: now,
            updatedAt: now
        }));
        saveIncidents(seedIncidents);

        localStorage.setItem(KEYS.INITIALIZED, '1');
    }

    // Public API
    return {
        generateId,
        // Countries
        getCountries, saveCountries, addCountry, updateCountry, deleteCountry,
        // Institutions
        getInstitutions, saveInstitutions, addInstitution, updateInstitution,
        deleteInstitution, getInstitutionsByCountries,
        // Incident Types
        getIncidentTypes, saveIncidentTypes, addIncidentType, updateIncidentType, deleteIncidentType,
        // Discrimination Types
        getDiscriminationTypes, saveDiscriminationTypes, addDiscriminationType,
        updateDiscriminationType, deleteDiscriminationType,
        // Incidents
        getIncidents, saveIncidents, getIncidentById, addIncident, updateIncident, deleteIncident,
        // Auth
        login, isLoggedIn, getSession, logout, requireAuth,
        // Init
        initialize
    };
})();
