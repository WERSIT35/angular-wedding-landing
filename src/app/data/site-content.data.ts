import { ContentSection, Language } from '../models/site-content.model';

export const CONTENT: Record<Language, ContentSection> = {
  en: {
    siteTagline: 'Luxury Weddings',
    brandName: 'Elite Weddings & Events Co.',
    navItems: [],
    headerCta: 'Book Consultation',
    hero: {
      eyebrow: 'Destination weddings in Georgia',
      title: 'Elite Weddings & Events Co.',
      subtitle: 'Luxury Wedding Planning & Destination Weddings in Georgia',
      description:
        'From romantic vineyard ceremonies in Kakheti to luxury celebrations in Tbilisi and breathtaking mountain weddings in Kazbegi, Elite Weddings & Events Co. designs unforgettable wedding experiences tailored to your love story.',
      primaryCta: 'Plan Your Dream Wedding',
      secondaryCta: 'Book Free Consultation',
      tertiaryCta: 'View Our Wedding Packages',
      stats: [
        { value: '20+', label: 'exclusive Georgia venues' },
        { value: '4', label: 'signature destination regions' },
        { value: '24h', label: 'response time for inquiries' }
      ]
    },
    flow: {
      eyebrow: 'Homepage flow',
      title: 'Hero to inquiry, designed to convert premium couples.',
      steps: ['Hero', 'Packages', 'Portfolio', 'Testimonials', 'Contact']
    },
    about: {
      eyebrow: 'About us',
      title: 'Elite Weddings & Events Co.',
      paragraphs: [
        'Elite Weddings & Events Co. is a premier wedding agency based in Tbilisi, specializing in luxury weddings, refined celebrations, and truly unforgettable events across Georgia.',
        'We believe every love story deserves to be brought to life through a beautifully curated experience. Our team blends creativity, professionalism, and deep local expertise to design weddings that authentically reflect each coupleâ€™s style, personality, and cultural essence.',
        'Georgia has emerged as one of the worldâ€™s most captivating wedding destinationsâ€”renowned for its breathtaking landscapes, historic venues, celebrated vineyards, and exceptional hospitality. Our mission is to transform these extraordinary settings into the perfect backdrop for your once-in-a-lifetime celebration.',
        'From your first consultation to the final firework, we take care of every detailâ€”so you can be fully present and enjoy every moment.'
      ],
      cta: 'RSVP now',
      cardTitle: 'Our Approach',
      differentiators: [
        'Tailor-made wedding concepts designed around your vision',
        'Complimentary initial consultation',
        'Dedicated 24/7 support throughout the planning journey',
        'Exclusive partnerships with exceptional venues',
        'Full wedding day coordination',
        'Access to a curated selection of premium additional services'
      ]
    },
    services: {
      eyebrow: 'Services',
      title: 'Planning support tailored to every stage of your celebration.',
      items: [
        {
          title: 'Full Wedding Planning',
          description:
            'Our full-service planning package covers every detail of your wedding journey.',
          items: [
            'Wedding concept & design',
            'Venue scouting and booking',
            'Vendor sourcing and management',
            'Decoration & floral design',
            'Photography and videography',
            'Catering & menu design',
            'Entertainment and music',
            'Guest management & logistics',
            'Wedding day coordination'
          ],
          cta: 'Request Full Wedding Planning'
        },
        {
          title: 'Destination Wedding Planning',
          description:
            'We help couples from around the world plan their perfect destination wedding in Georgia.',
          items: [
            'Tbilisi luxury venues',
            'Kakheti vineyard weddings',
            'Kazbegi mountain ceremonies',
            'Batumi seaside celebrations'
          ],
          cta: 'Plan Your Destination Wedding'
        },
        {
          title: 'Wedding Day Coordination',
          description:
            'Already planned your wedding but need professional coordination? Our team keeps every moment seamless.',
          items: [
            'Vendor timeline management',
            'Guest flow oversight',
            'Ceremony and reception cueing',
            'On-site problem solving'
          ],
          cta: 'Hire a Wedding Coordinator'
        },
        {
          title: 'Legal Wedding Assistance',
          description:
            'Georgia allows quick and simple marriage registration for international couples.',
          items: [
            'Document preparation',
            'Passport translations',
            'Marriage registration appointments',
            'Witness arrangements',
            'Apostille and legalization'
          ],
          cta: 'Get Legal Wedding Support'
        }
      ]
    },
    packages: {
      eyebrow: 'Wedding packages',
      title: 'Structured offers for intimate ceremonies through VIP celebrations.',
      items: [
        {
          title: 'Intimate Wedding Package',
          guests: 'Ideal for 2-15 guests',
          price: 'From $1,200',
          description: 'Perfect for elopements or small weddings.',
          items: [
            'Wedding planning consultation',
            'Ceremony location in Tbilisi',
            'Wedding coordinator',
            'Bridal bouquet & boutonniere',
            'Professional photographer (2 hours)',
            'Ceremony decoration',
            'Marriage registration assistance'
          ],
          cta: 'Book Intimate Wedding'
        },
        {
          title: 'Classic Wedding Package',
          guests: 'Ideal for 20-50 guests',
          price: 'From $6,000',
          description: 'Perfect for couples who want a beautiful wedding without the stress.',
          items: [
            'Full wedding planning',
            'Venue selection',
            'Floral design & decorations',
            'Wedding photographer (6 hours)',
            'Videographer',
            'Catering & wedding dinner',
            'DJ or live music',
            'Wedding day coordination'
          ],
          cta: 'View Classic Package Details',
          featured: true
        },
        {
          title: 'Luxury Destination Wedding',
          guests: 'Ideal for 50-150 guests',
          price: 'From $15,000',
          description: 'For couples who want an unforgettable luxury experience.',
          items: [
            'Full-service wedding planning',
            'Exclusive venue booking',
            'Luxury floral design & decor',
            'Wedding designer & stylist',
            'Photography & cinematic videography',
            'Entertainment & live band',
            'Luxury catering experience',
            'Guest transportation',
            'Accommodation assistance',
            'Wedding website for guests'
          ],
          cta: 'Plan Luxury Wedding'
        },
        {
          title: 'VIP Signature Wedding',
          guests: 'Elite Weddings premium experience',
          price: 'From $35,000',
          description: 'A fully tailored, multi-day celebration for exceptional events.',
          items: [
            'Fully customized wedding concept',
            'Private venue buyout',
            'International vendor team',
            'Multi-day celebration',
            'Luxury floral installations',
            'Celebrity-level entertainment',
            'Dedicated planning team'
          ],
          cta: 'Request VIP Wedding Planning'
        }
      ]
    },
    destinations: {
      eyebrow: 'Destinations / Venues in Georgia',
      title: 'The most beautiful wedding locations in Georgia.',
      description: 'Georgia offers stunning wedding locations from vineyards to mountains.',
      items: [
        {
          title: 'Tbilisi',
          description: 'Luxury city weddings with historic architecture and rooftop glamour.'
        },
        {
          title: 'Kakheti',
          description: 'Romantic vineyard weddings surrounded by nature and fine wine.'
        },
        {
          title: 'Kazbegi',
          description: 'Mountain ceremonies framed by breathtaking alpine views.'
        },
        {
          title: 'Batumi',
          description: 'Seaside weddings with modern resorts and coastal elegance.'
        }
      ],
      cta: 'Explore Wedding Venues'
    },
    portfolio: {
      eyebrow: 'Portfolio',
      title: 'A gallery structure built for storytelling and luxury visuals.',
      groups: [
        'Real Weddings',
        'Wedding Decor',
        'Destination Weddings',
        'Luxury Weddings',
        'Engagement Shoots'
      ],
      cta: 'View Wedding Gallery'
    },
    testimonials: {
      eyebrow: 'Testimonials',
      title: 'Words from couples who trusted us with the celebration of a lifetime.',
      items: [
        {
          quote:
            'Elite Weddings & Events Co. made our dream wedding come true. Every detail was perfect and the planning process was stress-free.',
          name: 'Emma & Daniel',
          country: 'UK'
        },
        {
          quote:
            'Planning a destination wedding seemed impossible until we found this amazing team.',
          name: 'Sofia & Marco',
          country: 'Italy'
        }
      ],
      cta: 'Read More Reviews'
    },
    blog: {
      eyebrow: 'Blog / Wedding tips',
      title: 'Editorial topics built to support SEO and helpful planning content.',
      badge: 'Featured article',
      items: [
        'How to Plan a Destination Wedding in Georgia',
        'Best Wedding Venues in Kakheti',
        'Cost of Weddings in Georgia',
        'Tbilisi Wedding Guide',
        'Legal Marriage for Foreign Couples'
      ],
      cta: 'Read Wedding Tips'
    },
    faq: {
      eyebrow: 'Frequently Asked Questions',
      title: 'Frequently Asked Questions',
      answer:
        'Absolutely. Georgia is one of the most sought-after wedding destinations, offering a unique blend of stunning natural beautyâ€”from mountains to seasideâ€”historic cities, rich cultural traditions, and warm hospitality. Its world-renowned cuisine and wine elevate every celebration into an extraordinary and memorable experience.',
      items: [
        'Is Georgia a good destination for a wedding?',
        'How much does a wedding cost in Georgia?',
        'Can foreigners legally get married in Georgia?',
        'How far in advance should we book?',
        'Do you assist with documentation? What is included in your service?'
      ],
      answers: [
        'Absolutely. Georgia is one of the most sought-after wedding destinations, offering a unique blend of stunning natural beautyâ€”from mountains to seasideâ€”historic cities, rich cultural traditions, and warm hospitality. Its world-renowned cuisine and wine elevate every celebration into an extraordinary and memorable experience.',
        'Wedding costs in Georgia vary depending on your preferences and requirements. During our complimentary consultation, we carefully plan your wedding details and provide a tailored budgetâ€”whether based on our curated packages or a fully customized concept designed just for you.',
        'Yes, foreigners can legally marry in Georgia with ease. The process is efficient, straightforward, and widely recognized for its simplicity.',
        'We recommend booking at least 3â€“6 months in advance, especially for peak seasons such as spring and summer. For larger or more elaborate weddings, planning 6â€“12 months ahead ensures every detail is executed flawlessly.',
        'Yes, we provide comprehensive support throughout the entire process. Our services include complimentary consultation, assistance with all required documentation, professional translation services, organization of official marriage registration, venue sourcing and design planning, and coordination of dÃ©cor, photography, and additional services. Our goal is to make your experience effortless, enjoyable, and completely stress-free.'
      ]
    },
    extras: {
      eyebrow: 'Extra features',
      title: 'Premium additions that make the experience feel modern and effortless.',
      items: [
        'Wedding Budget Calculator',
        'Venue Finder',
        'Online Consultation Booking',
        'Instagram Gallery',
        'WhatsApp Chat Button'
      ]
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Plan Your Dream Wedding',
      description: 'Fill out the form and our wedding planners will contact you within 24 hours.',
      labels: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone / WhatsApp',
        weddingType: 'What kind of wedding do you want?',
        date: 'Wedding Date',
        guests: 'Number of Guests',
        location: 'Preferred Location',
        budget: 'Budget',
        message: 'Message'
      },
      placeholders: {
        name: 'Your full name',
        email: 'you@example.com',
        phone: '+995 ...',
        weddingType: 'Choose wedding type',
        guests: 'e.g. 50',
        location: 'Tbilisi, Kakheti, Kazbegi...',
        budget: 'From $6,000',
        message: 'Tell us about your vision, guests, and preferred style.'
      },
      actions: {
        consultation: 'Book Free Consultation',
        inquiry: 'Send Wedding Inquiry',
        call: 'Schedule Video Call'
      },
      cardTitle: 'Why couples choose Georgia',
      reasons: [
        'Fast legal marriage process for international couples',
        'Luxury venues across vineyards, mountains, and sea',
        'Excellent value compared with many European destinations',
        'Warm hospitality and unforgettable guest experiences'
      ]
    }
  },
  ka: {
    siteTagline: 'luqs qorwilebi',
    brandName: 'Elite Weddings & Events Co.',
    navItems: [],
    headerCta: 'konsultaciis dajavSna',
    hero: {
      eyebrow: 'destinaciuri qorwilebi saqartveloSi',
      title: 'Elite Weddings & Events Co.',
      subtitle: 'luqs qorwilis dagegmva da destinaciuri qorwilebi saqartveloSi',
      description:
        'kaxeTis romantikuli venaxebidan tbilisis elegantur dResaswaulebamde da yazbegis StambeWdav mtis ceremoniebamde, Elite Weddings & Events Co. qmnis dauviwyar saqorwilo gamocdilebas, romelic zustad tqvens siyvarulis istorias ergeba.',
      primaryCta: 'daiwyet tqveni saocnebo qorwilis dagegmva',
      secondaryCta: 'dajavSnet ufaso konsultacia',
      tertiaryCta: 'ixilet Cveni saqorwilo paketebi',
      stats: [
        { value: '20+', label: 'eqskluziuri lokacia saqartveloSi' },
        { value: '4', label: 'gamorCeuli regioni qorwilistvis' },
        { value: '24st', label: 'motxovnaze pasuxis dro' }
      ]
    },
    flow: {
      eyebrow: 'mtavari gverdis struqtura',
      title: 'hirodan motxovnamde, premium wyvilebze morgebuli gzit.',
      steps: ['hiro', 'paketebi', 'portfolio', 'Sefasebebi', 'kontaqti']
    },
    about: {
      eyebrow: 'Cven Sesaxeb',
      title: 'Elite Weddings & Events Co.',
      paragraphs: [
        'Elite Weddings & Events Co. aris adgilobrivi saqorwilo saagento tbilisSi, romelic specializebda luqs qorwilebSi, elegantur dResaswaulsa da dauviwyar RonisziebebSi, mteli saqartvelos maStabit.',
        'Cven gvjera, rom yvela siyvarulis istoria imsaxurebs lamazad organizebul dRes. Cveni gundi aertianebs kreativobas, profesionalizmsa da adgilobriv gamocdilebas, rata Sevqmnat qorwili, romelic wyvilis stils, xasiatsa da kulturas sauketesod asaxavs.',
        'saqartvelo ert-ert yvelaze sasurvel saqorwilo mimartulebad iqca tavisi StambeWdavi peizajebit, istoriuli sivrceebit, cnobili venaxebita da tbili maspinZlobiT. Cveni misiaa es lokaciebi tqveni gansakutrebuli dRis idealur scenad vaqciot.',
        'pirveli konsultaciidan bolo feierverkamde, Cven uzrunvelvyoft yvela detals, rata tqven mxolod isiamovnot am dRit.',
        'mzad xart tqveni ocnebis qorwili Cventan ertad realobad aqciot?'
      ],
      cta: 'RSVP axlave',
      cardTitle: 'Cventan tanamSromlobis prioritetebi',
      differentiators: [
        'personalizebuli saqorwilo koncefciebi',
        'pirveladi ufaso konsultacia',
        '24/7 mxaredaWera javSnis Semdgom periodSi',
        'eqskluziuri partnioroba lokaciebTan',
        'qorwilis sruli dRis koordinacia',
        'damatebiti servisebis SesaZlebloba'
      ]
    },
    services: {
      eyebrow: 'servisebi',
      title: 'dagegmvis servisebi, romelic tqveni dRis yvela etaps moergeba.',
      items: [
        {
          title: 'qorwilis sruli dagegmva',
          description: 'Cveni sruli servisi faravs tqveni qorwilis mogzaurobis yvela detals.',
          items: [
            'qorwilis koncefcia da dizaini',
            'lokaciis moZieba da dajavSna',
            'vendorebis SerCeva da martva',
            'dekori da floristika',
            'foto da video gadaReba',
            'kateringi da menius dizaini',
            'gartoba da musika',
            'stumrebis martva da lojistika',
            'qorwilis dRis koordinacia'
          ],
          cta: 'moitxovet sruli dagegmvis servisi'
        },
        {
          title: 'destinaciuri qorwilis dagegmva',
          description:
            'vxmarobt msoflios sxvadasxva qveynidan Camosul wyvilebs, rom saqartveloSi idealuri qorwili dagegmon.',
          items: [
            'tbilisis luqs lokaciebi',
            'kaxeTis venaxebSi qorwili',
            'yazbegis mtis ceremonia',
            'batumis sanapiro dResaswaulebi'
          ],
          cta: 'dagegmet destinaciuri qorwili'
        },
        {
          title: 'qorwilis dRis koordinacia',
          description:
            'tu qorwili ukve dagegmili gaqvt, Cveni gundi uzrunvelyofs, rom dRe Seuferxeblad Caiaros.',
          items: [
            'vendorebis taimingis martva',
            'stumrebis nakadis kontroli',
            'ceremoniisa da miRebis koordinacia',
            'adgilze problemebis swrafi gadawyveta'
          ],
          cta: 'daiqiravet koordinatori'
        },
        {
          title: 'iuridiuli daxmareba qorwilistvis',
          description:
            'saqartveloSi ucxoelebistvis qorwinebis registracia swrafi da martivia, Cven ki yvela etapze dagexmarebit.',
          items: [
            'dokumentebis momzadeba',
            'pasportebis targmna',
            'qorwinebis registraciis CaniSnva',
            'mowmeebis uzrunvelyofa',
            'apostili da legalizacia'
          ],
          cta: 'miiRet iuridiuli mxardaWera'
        }
      ]
    },
    packages: {
      eyebrow: 'saqorwilo paketebi',
      title: 'struqturirebuli paketebi intimuri ceremoniidan vip RonisZiebamde.',
      items: [
        {
          title: 'intimuri qorwilis paketi',
          guests: 'idealuria 2-15 stumristvis',
          price: 'fasi $1,200-dan',
          description: 'SesaniSnavia elopmentistvis an patara qorwilistvis.',
          items: [
            'sakonsultacio Sexvedra',
            'ceremoniis lokacia tbilisSi',
            'qorwilis koordinatori',
            'saqorwilo taiguli da butonieri',
            'profesionali fotografi (2 saati)',
            'ceremoniis dekori',
            'qorwinebis registraciis daxmareba'
          ],
          cta: 'dajavSnet intimuri qorwili'
        },
        {
          title: 'klasikuri qorwilis paketi',
          guests: 'idealuria 20-50 stumristvis',
          price: 'fasi $6,000-dan',
          description: 'wyvilebistvis, visac surs lamazi qorwili zedmeti stresis gareSe.',
          items: [
            'qorwilis sruli dagegmva',
            'lokaciis SerCeva',
            'floristika da dekori',
            'fotografi (6 saati)',
            'videografi',
            'kateringi da saqorwilo vaxSami',
            'dijei an cocxali musika',
            'qorwilis dRis koordinacia'
          ],
          cta: 'ixilet klasikuri paketis detalebi',
          featured: true
        },
        {
          title: 'luqs destinaciuri qorwili',
          guests: 'idealuria 50-150 stumristvis',
          price: 'fasi $15,000-dan',
          description: 'wyvilebistvis, visac namdvilad dauviwyari luqs gamocdileba surs.',
          items: [
            'qorwilis sruli servisi',
            'eqskluziuri lokaciis dajavSna',
            'luqs floristika da dekori',
            'qorwilis dizaineri da stilisti',
            'fotografia da kinematografiuli video',
            'gartoba da cocxali bendi',
            'premium kateringi',
            'stumrebis transportireba',
            'gantavsebis daxmareba',
            'saqorwilo vebsaiti stumrebistvis'
          ],
          cta: 'dagegmet luqs qorwili'
        },
        {
          title: 'vip xelweriti qorwili',
          guests: 'Elite Weddings-is premium gamocdileba',
          price: 'fasi $35,000-dan',
          description: 'srulad individualuri, mravaldRiani RonisZieba gamorCeuli wyvilebistvis.',
          items: [
            'srulad morgebuli koncefcia',
            'kerZo lokaciis sruli daqiraveba',
            'saertaSoriso vendorebis gundi',
            'mravaldRiani zeimi',
            'luqs floraluri instalaciebi',
            'umaRlesi donis gartoba',
            'gamoyofili planing gundi'
          ],
          cta: 'moitxovet vip dagegmva'
        }
      ]
    },
    destinations: {
      eyebrow: 'lokaciebi / veniuebi saqartveloSi',
      title: 'yvelaze lamazi saqorwilo lokaciebi saqartveloSi.',
      description: 'saqartvelo gtavazobt StambeWdav adgilebs venaxebidan mtebamde.',
      items: [
        {
          title: 'tbilisi',
          description: 'qalaquri luqs qorwilebi istoriuli arqiteqturita da daxvewili atmosferoti.'
        },
        {
          title: 'kaxeTi',
          description: 'romantikuli qorwilebi venaxebSi, bunebita da Rvinis kulturit garSemortymuli.'
        },
        {
          title: 'yazbegi',
          description: 'mtis ceremoniebi StambeWdavi xedebit da gamorCeuli emociebit.'
        },
        {
          title: 'batumi',
          description: 'zRvispira qorwilebi tanamedrove rezortebita da sanapiro eleganturobit.'
        }
      ],
      cta: 'ixilet saqorwilo lokaciebi'
    },
    portfolio: {
      eyebrow: 'portfolio',
      title: 'galereis struqtura, romelic istorias da luqs vizuals aertianebs.',
      groups: [
        'realuri qorwilebi',
        'saqorwilo dekori',
        'destinaciuri qorwilebi',
        'luqs qorwilebi',
        'niSnobis fotosesiebi'
      ],
      cta: 'ixilet saqorwilo galerea'
    },
    testimonials: {
      eyebrow: 'Sefasebebi',
      title: 'wyvilebis sityvebi, romlebmac tavianti cxovrebis mniSvnelovani dRe Cven gvandes.',
      items: [
        {
          quote:
            'Elite Weddings & Events Co.-m Cveni saocnebo qorwili realobad aqcia. yvela detali idealuri iyo da procesi sruliad mSvidi.',
          name: 'ema da danieli',
          country: 'didi britaneti'
        },
        {
          quote:
            'destinaciuri qorwilis dagegmva SeuZlebeli gvegona, sanam am saocar gunds ar Sevxvdit.',
          name: 'sofia da marko',
          country: 'italia'
        }
      ],
      cta: 'ixilet meti Sefaseba'
    },
    blog: {
      eyebrow: 'blogi / saqorwilo rCevebi',
      title: 'saredaqcio temebi SEO-stvis da sasargeblo dagegmvis kontentistvis.',
      badge: 'rCeuli statia',
      items: [
        'rogor davgegmot destinaciuri qorwili saqartveloSi',
        'sauketeso saqorwilo lokaciebi kaxetSi',
        'qorwilis Rirebuleba saqartveloSi',
        'tbilisis saqorwilo gzamkvlevi',
        'iuridiuli qorwineba ucxoelebistvis'
      ],
      cta: 'waikitxet saqorwilo rCevebi'
    },
    faq: {
      eyebrow: 'xSiri kitxvebi',
      title: 'pasuxebi kitxvebze, romlebsac yvelaze xSirad svamen.',
      answer:
        'diakh, saqartvelo ert-erti sauketeso mimartulebaa qorwilistvis. aq ertdroulad Sexvdebit ulamazes bunebas, mtebs, zRvispiretsa da istoriul qalaqebs, mdidar kulturas, tradiciebsa da stumartmoyvare garemos. gansakutrebiT gamoirCeva qarTuli samzareulo da Rvino, rac qorwils unikalu da dauviwyar gamocdilebad aqcevs.',
      items: [
        'aris tu ara saqartvelo kargi mimartuleba qorwilistvis?',
        'ra Rirs qorwili saqartveloSi?',
        'SeuZliat tu ara ucxoelebs saqartveloSi kanonierad daqorwindnen?',
        'ramdeni xnit adre unda davjavSnot?',
        'gvekhmarebit tu ara dokumentebSi? ra Sedis tqvens momsaxurebaSi?'
      ],
      answers: [
        'diakh, saqartvelo ert-erti sauketeso mimartulebaa qorwilistvis. aq ertdroulad Sexvdebit ulamazes bunebas, mtebs, zRvispiretsa da istoriul qalaqebs, mdidar kulturas, tradiciebsa da stumartmoyvare garemos. gansakutrebiT gamoirCeva qarTuli samzareulo da Rvino, rac qorwils unikalu da dauviwyar gamocdilebad aqcevs.',
        'qorwilis Rirebuleba saqartveloSi damokidebulia mraval faktorze. pirvelad ufaso konsultaciaze Cven uzrunvelvyoft qorwilis detalebis dagegmarebas, mat Soris gansazRvravt qorwilis Rirebulebas, rogorc Cveni paketebis mixedvit, aseve tqvenze morgebuli survilebisa da SesaZleblobebis Sesabamisad.',
        'diakh, saqartveloSi ucxoelebs martivad SeuZliat oficialurad daqorwineba. procesi sakmaod swrafi da martivia.',
        'rekomendebulia qorwilis dajavSna minimum 3-6 tvit adre, gansakutrebiT tu popularul sezonze gegmavt. didi da maStaburi qorwilebistvis ki uketesia 6-12 tvit adre dagegmva, rata yvela detali mSvidad da xarisxianad moeswros.',
        'diakh, Cven srulad Cartuli vart dokumentebis momzadebasa da qorwilis organizebaSi. Cvens momsaxurebaSi Sedis pirveladi ufaso konsultacia, saCiro dokumentebis SegrovebaSi daxmareba, tarjimnis uzrunvelyofa, qorwinebis registraciis organizeba, aseve lokaciis, dekoris, fotografis da sxva servisebis dagegmva. Cveni mizania, rom procesi tqventvis iyos martivi da stresisgan tavisufali.'
      ]
    },
    extras: {
      eyebrow: 'damatebiti funqciebi',
      title: 'premium damatebebi, romlebic gamocdilebas tanamedrove da martivs xdis.',
      items: [
        'saqorwilo biujetis kalkulatori',
        'venius maZiebeli',
        'onlain konsultaciis dajavSna',
        'instagram galerea',
        'whatsapp Catis Rilaki'
      ]
    },
    contact: {
      eyebrow: 'kontaqti',
      title: 'dagegmet tqveni saocnebo qorwili',
      description: 'Seavset forma da Cveni gundi 24 saatSi dagikavSirdebat.',
      labels: {
        name: 'saxeli',
        email: 'elfosta',
        phone: 'telefoni / whatsapp',
        weddingType: 'What kind of wedding do you want?',
        date: 'qorwilis tariRi',
        guests: 'stumrebis raodenoba',
        location: 'sasurveli lokacia',
        budget: 'biujeti',
        message: 'mesiji'
      },
      placeholders: {
        name: 'tqveni sruli saxeli',
        email: 'you@example.com',
        phone: '+995 ...',
        weddingType: 'Coose wedding type',
        guests: 'magalitad 50',
        location: 'tbilisi, kaxeTi, yazbegi...',
        budget: '$6,000-dan',
        message: 'mogviyevit tqveni xedvis, stumrebis da stilis Sesaxeb.'
      },
      actions: {
        consultation: 'dajavSnet ufaso konsultacia',
        inquiry: 'gamogvigzavnet motxovna',
        call: 'dagegmet videozari'
      },
      cardTitle: 'ratom irCeven wyvilebi saqartvelos',
      reasons: [
        'ucxoelebistvis qorwinebis swrafi da martivi procesi',
        'luqs lokaciebi venaxebSi, mtebSi da zRvispiretSi',
        'Zalian kargi Rirebuleba evropis bevr mimartulebastan Sedarebit',
        'tbili maspinZloba da dauviwyari gamocdileba stumrebistvis'
      ]
    }
  }
};
