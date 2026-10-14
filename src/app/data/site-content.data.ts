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
        'We believe every love story deserves to be brought to life through a beautifully curated experience. Our team blends creativity, professionalism, and deep local expertise to design weddings that authentically reflect each couple’s style, personality, and cultural essence.',
        'Georgia has emerged as one of the world’s most captivating wedding destinations—renowned for its breathtaking landscapes, historic venues, celebrated vineyards, and exceptional hospitality. Our mission is to transform these extraordinary settings into the perfect backdrop for your once-in-a-lifetime celebration.',
        'From your first consultation to the final firework, we take care of every detail—so you can be fully present and enjoy every moment.'
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
        'Absolutely. Georgia is one of the most sought-after wedding destinations, offering a unique blend of stunning natural beauty—from mountains to seaside—historic cities, rich cultural traditions, and warm hospitality. Its world-renowned cuisine and wine elevate every celebration into an extraordinary and memorable experience.',
      items: [
        'Is Georgia a good destination for a wedding?',
        'How much does a wedding cost in Georgia?',
        'Can foreigners legally get married in Georgia?',
        'How far in advance should we book?',
        'Do you assist with documentation? What is included in your service?'
      ],
      answers: [
        'Absolutely. Georgia is one of the most sought-after wedding destinations, offering a unique blend of stunning natural beauty—from mountains to seaside—historic cities, rich cultural traditions, and warm hospitality. Its world-renowned cuisine and wine elevate every celebration into an extraordinary and memorable experience.',
        'Wedding costs in Georgia vary depending on your preferences and requirements. During our complimentary consultation, we carefully plan your wedding details and provide a tailored budget—whether based on our curated packages or a fully customized concept designed just for you.',
        'Yes, foreigners can legally marry in Georgia with ease. The process is efficient, straightforward, and widely recognized for its simplicity.',
        'We recommend booking at least 3–6 months in advance, especially for peak seasons such as spring and summer. For larger or more elaborate weddings, planning 6–12 months ahead ensures every detail is executed flawlessly.',
        'Yes, we provide comprehensive support throughout the entire process. Our services include complimentary consultation, assistance with all required documentation, professional translation services, organization of official marriage registration, venue sourcing and design planning, and coordination of décor, photography, and additional services. Our goal is to make your experience effortless, enjoyable, and completely stress-free.'
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
  // Written in Georgian script. resolvedContent() converts it to the Barata/Sanet keyboard
  // keys at runtime (ქართველი → qarTveli), so nobody has to hand-type the key form.
  ka: {
    siteTagline: 'ლუქს ქორწილები',
    brandName: 'Elite Weddings & Events Co.',
    navItems: [],
    headerCta: 'კონსულტაციის დაჯავშნა',
    hero: {
      eyebrow: 'დესტინაციური ქორწილები საქართველოში',
      title: 'Elite Weddings & Events Co.',
      subtitle: 'ლუქს ქორწილის დაგეგმვა და დესტინაციური ქორწილები საქართველოში',
      description:
        'კახეთის რომანტიკული ვენახებიდან თბილისის ელეგანტურ დღესასწაულებამდე და ყაზბეგის შთამბეჭდავ მთის ცერემონიებამდე, Elite Weddings & Events Co. ქმნის დაუვიწყარ საქორწილო გამოცდილებას, რომელიც ზუსტად თქვენს სიყვარულის ისტორიას ერგება.',
      primaryCta: 'დაიწყეთ თქვენი საოცნებო ქორწილის დაგეგმვა',
      secondaryCta: 'დაჯავშნეთ უფასო კონსულტაცია',
      tertiaryCta: 'იხილეთ ჩვენი საქორწილო პაკეტები',
      stats: [
        { value: '20+', label: 'ექსკლუზიური ლოკაცია საქართველოში' },
        { value: '4', label: 'გამორჩეული რეგიონი ქორწილისთვის' },
        { value: '24სთ', label: 'მოთხოვნაზე პასუხის დრო' }
      ]
    },
    flow: {
      eyebrow: 'მთავარი გვერდის სტრუქტურა',
      title: 'ჰიროდან მოთხოვნამდე, პრემიუმ წყვილებზე მორგებული გზით.',
      steps: ['ჰირო', 'პაკეტები', 'პორტფოლიო', 'შეფასებები', 'კონტაქტი']
    },
    about: {
      eyebrow: 'ჩვენ შესახებ',
      title: 'Elite Weddings & Events Co.',
      paragraphs: [
        'Elite Weddings & Events Co. არის ადგილობრივი საქორწილო სააგენტო თბილისში, რომელიც სპეციალიზებულია ლუქს ქორწილებზე, ელეგანტურ დღესასწაულებსა და დაუვიწყარ ღონისძიებებზე მთელი საქართველოს მასშტაბით.',
        'ჩვენ გვჯერა, რომ ყველა სიყვარულის ისტორია იმსახურებს ლამაზად ორგანიზებულ დღეს. ჩვენი გუნდი აერთიანებს კრეატიულობას, პროფესიონალიზმსა და ადგილობრივ გამოცდილებას, რათა შევქმნათ ქორწილი, რომელიც წყვილის სტილს, ხასიათსა და კულტურას საუკეთესოდ ასახავს.',
        'საქართველო ერთ-ერთ ყველაზე სასურველ საქორწილო მიმართულებად იქცა თავისი შთამბეჭდავი პეიზაჟებით, ისტორიული სივრცეებით, ცნობილი ვენახებითა და თბილი მასპინძლობით. ჩვენი მისიაა, ეს ლოკაციები თქვენი განსაკუთრებული დღის იდეალურ სცენად ვაქციოთ.',
        'პირველი კონსულტაციიდან ბოლო ფეიერვერკამდე ჩვენ ვუზრუნველყოფთ ყველა დეტალს, რათა თქვენ მხოლოდ ისიამოვნოთ ამ დღით.',
        'მზად ხართ, თქვენი ოცნების ქორწილი ჩვენთან ერთად რეალობად აქციოთ?'
      ],
      cta: 'დაჯავშნეთ ახლავე',
      cardTitle: 'ჩვენთან თანამშრომლობის პრიორიტეტები',
      differentiators: [
        'პერსონალიზებული საქორწილო კონცეფციები',
        'პირველადი უფასო კონსულტაცია',
        '24/7 მხარდაჭერა დაჯავშნის შემდგომ პერიოდში',
        'ექსკლუზიური პარტნიორობა ლოკაციებთან',
        'ქორწილის სრული დღის კოორდინაცია',
        'დამატებითი სერვისების შესაძლებლობა'
      ]
    },
    services: {
      eyebrow: 'სერვისები',
      title: 'დაგეგმვის სერვისები, რომლებიც თქვენი დღის ყველა ეტაპს მოერგება.',
      items: [
        {
          title: 'ქორწილის სრული დაგეგმვა',
          description: 'ჩვენი სრული სერვისი მოიცავს თქვენი ქორწილის მოგზაურობის ყველა დეტალს.',
          items: [
            'ქორწილის კონცეფცია და დიზაინი',
            'ლოკაციის მოძიება და დაჯავშნა',
            'ვენდორების შერჩევა და მართვა',
            'დეკორი და ფლორისტიკა',
            'ფოტო და ვიდეო გადაღება',
            'კეიტერინგი და მენიუს დიზაინი',
            'გართობა და მუსიკა',
            'სტუმრების მართვა და ლოჯისტიკა',
            'ქორწილის დღის კოორდინაცია'
          ],
          cta: 'მოითხოვეთ სრული დაგეგმვის სერვისი'
        },
        {
          title: 'დესტინაციური ქორწილის დაგეგმვა',
          description:
            'ვეხმარებით მსოფლიოს სხვადასხვა ქვეყნიდან ჩამოსულ წყვილებს, რომ საქართველოში იდეალური ქორწილი დაგეგმონ.',
          items: [
            'თბილისის ლუქს ლოკაციები',
            'ქორწილი კახეთის ვენახებში',
            'ყაზბეგის მთის ცერემონია',
            'ბათუმის სანაპირო დღესასწაულები'
          ],
          cta: 'დაგეგმეთ დესტინაციური ქორწილი'
        },
        {
          title: 'ქორწილის დღის კოორდინაცია',
          description:
            'თუ ქორწილი უკვე დაგეგმილი გაქვთ, ჩვენი გუნდი უზრუნველყოფს, რომ დღემ შეუფერხებლად ჩაიაროს.',
          items: [
            'ვენდორების ტაიმინგის მართვა',
            'სტუმრების ნაკადის კონტროლი',
            'ცერემონიისა და მიღების კოორდინაცია',
            'ადგილზე პრობლემების სწრაფი გადაწყვეტა'
          ],
          cta: 'დაიქირავეთ კოორდინატორი'
        },
        {
          title: 'იურიდიული დახმარება ქორწილისთვის',
          description:
            'საქართველოში უცხოელებისთვის ქორწინების რეგისტრაცია სწრაფი და მარტივია, ჩვენ კი ყველა ეტაპზე დაგეხმარებით.',
          items: [
            'დოკუმენტების მომზადება',
            'პასპორტების თარგმნა',
            'ქორწინების რეგისტრაციის ჩანიშვნა',
            'მოწმეების უზრუნველყოფა',
            'აპოსტილი და ლეგალიზაცია'
          ],
          cta: 'მიიღეთ იურიდიული მხარდაჭერა'
        }
      ]
    },
    packages: {
      eyebrow: 'საქორწილო პაკეტები',
      title: 'სტრუქტურირებული პაკეტები ინტიმური ცერემონიიდან ვიპ ღონისძიებამდე.',
      items: [
        {
          title: 'ინტიმური ქორწილის პაკეტი',
          guests: 'იდეალურია 2-15 სტუმრისთვის',
          price: 'ფასი $1,200-დან',
          description: 'შესანიშნავია ელოუპმენტისთვის ან პატარა ქორწილისთვის.',
          items: [
            'საკონსულტაციო შეხვედრა',
            'ცერემონიის ლოკაცია თბილისში',
            'ქორწილის კოორდინატორი',
            'საქორწილო თაიგული და ბუტონიერი',
            'პროფესიონალი ფოტოგრაფი (2 საათი)',
            'ცერემონიის დეკორი',
            'ქორწინების რეგისტრაციის დახმარება'
          ],
          cta: 'დაჯავშნეთ ინტიმური ქორწილი'
        },
        {
          title: 'კლასიკური ქორწილის პაკეტი',
          guests: 'იდეალურია 20-50 სტუმრისთვის',
          price: 'ფასი $6,000-დან',
          description: 'წყვილებისთვის, ვისაც სურს ლამაზი ქორწილი ზედმეტი სტრესის გარეშე.',
          items: [
            'ქორწილის სრული დაგეგმვა',
            'ლოკაციის შერჩევა',
            'ფლორისტიკა და დეკორი',
            'ფოტოგრაფი (6 საათი)',
            'ვიდეოგრაფი',
            'კეიტერინგი და საქორწილო ვახშამი',
            'დიჯეი ან ცოცხალი მუსიკა',
            'ქორწილის დღის კოორდინაცია'
          ],
          cta: 'იხილეთ კლასიკური პაკეტის დეტალები',
          featured: true
        },
        {
          title: 'ლუქს დესტინაციური ქორწილი',
          guests: 'იდეალურია 50-150 სტუმრისთვის',
          price: 'ფასი $15,000-დან',
          description: 'წყვილებისთვის, ვისაც ნამდვილად დაუვიწყარი ლუქს გამოცდილება სურს.',
          items: [
            'ქორწილის სრული სერვისი',
            'ექსკლუზიური ლოკაციის დაჯავშნა',
            'ლუქს ფლორისტიკა და დეკორი',
            'ქორწილის დიზაინერი და სტილისტი',
            'ფოტოგრაფია და კინემატოგრაფიული ვიდეო',
            'გართობა და ცოცხალი ბენდი',
            'პრემიუმ კეიტერინგი',
            'სტუმრების ტრანსპორტირება',
            'განთავსების დახმარება',
            'საქორწილო ვებსაიტი სტუმრებისთვის'
          ],
          cta: 'დაგეგმეთ ლუქს ქორწილი'
        },
        {
          title: 'ვიპ ხელწერითი ქორწილი',
          guests: 'ელიტ ვედინგსის პრემიუმ გამოცდილება',
          price: 'ფასი $35,000-დან',
          description: 'სრულად ინდივიდუალური, მრავალდღიანი ღონისძიება გამორჩეული წყვილებისთვის.',
          items: [
            'სრულად მორგებული კონცეფცია',
            'კერძო ლოკაციის სრული დაქირავება',
            'საერთაშორისო ვენდორების გუნდი',
            'მრავალდღიანი ზეიმი',
            'ლუქს ფლორალური ინსტალაციები',
            'უმაღლესი დონის გართობა',
            'გამოყოფილი დაგეგმვის გუნდი'
          ],
          cta: 'მოითხოვეთ ვიპ დაგეგმვა'
        }
      ]
    },
    destinations: {
      eyebrow: 'ლოკაციები / ვენიუები საქართველოში',
      title: 'ყველაზე ლამაზი საქორწილო ლოკაციები საქართველოში.',
      description: 'საქართველო გთავაზობთ შთამბეჭდავ ადგილებს ვენახებიდან მთებამდე.',
      items: [
        {
          title: 'თბილისი',
          description: 'ქალაქური ლუქს ქორწილები ისტორიული არქიტექტურითა და დახვეწილი ატმოსფეროთი.'
        },
        {
          title: 'კახეთი',
          description: 'რომანტიკული ქორწილები ვენახებში, ბუნებითა და ღვინის კულტურით გარშემორტყმული.'
        },
        {
          title: 'ყაზბეგი',
          description: 'მთის ცერემონიები შთამბეჭდავი ხედებითა და გამორჩეული ემოციებით.'
        },
        {
          title: 'ბათუმი',
          description: 'ზღვისპირა ქორწილები თანამედროვე კურორტებითა და სანაპიროს ელეგანტურობით.'
        }
      ],
      cta: 'იხილეთ საქორწილო ლოკაციები'
    },
    portfolio: {
      eyebrow: 'პორტფოლიო',
      title: 'გალერეის სტრუქტურა, რომელიც ისტორიასა და ლუქს ვიზუალს აერთიანებს.',
      groups: [
        'რეალური ქორწილები',
        'საქორწილო დეკორი',
        'დესტინაციური ქორწილები',
        'ლუქს ქორწილები',
        'ნიშნობის ფოტოსესიები'
      ],
      cta: 'იხილეთ საქორწილო გალერეა'
    },
    testimonials: {
      eyebrow: 'შეფასებები',
      title: 'წყვილების სიტყვები, რომლებმაც თავიანთი ცხოვრების მნიშვნელოვანი დღე ჩვენ გვანდეს.',
      items: [
        {
          quote:
            'Elite Weddings & Events Co.-მ ჩვენი საოცნებო ქორწილი რეალობად აქცია. ყველა დეტალი იდეალური იყო, პროცესი კი სრულიად მშვიდი.',
          name: 'ემა და დანიელი',
          country: 'დიდი ბრიტანეთი'
        },
        {
          quote:
            'დესტინაციური ქორწილის დაგეგმვა შეუძლებელი გვეგონა, სანამ ამ საოცარ გუნდს არ შევხვდით.',
          name: 'სოფია და მარკო',
          country: 'იტალია'
        }
      ],
      cta: 'იხილეთ მეტი შეფასება'
    },
    blog: {
      eyebrow: 'ბლოგი / საქორწილო რჩევები',
      title: 'სარედაქციო თემები საძიებო სისტემებისთვის და სასარგებლო დაგეგმვის კონტენტისთვის.',
      badge: 'რჩეული სტატია',
      items: [
        'როგორ დავგეგმოთ დესტინაციური ქორწილი საქართველოში',
        'საუკეთესო საქორწილო ლოკაციები კახეთში',
        'ქორწილის ღირებულება საქართველოში',
        'თბილისის საქორწილო გზამკვლევი',
        'იურიდიული ქორწინება უცხოელებისთვის'
      ],
      cta: 'წაიკითხეთ საქორწილო რჩევები'
    },
    faq: {
      eyebrow: 'ხშირი კითხვები',
      title: 'პასუხები კითხვებზე, რომლებსაც ყველაზე ხშირად სვამენ.',
      answer:
        'დიახ, საქართველო ერთ-ერთი საუკეთესო მიმართულებაა ქორწილისთვის. აქ ერთდროულად შეხვდებით ულამაზეს ბუნებას, მთებს, ზღვისპირეთსა და ისტორიულ ქალაქებს, მდიდარ კულტურას, ტრადიციებსა და სტუმართმოყვარე გარემოს. განსაკუთრებით გამოირჩევა ქართული სამზარეულო და ღვინო, რაც ქორწილს უნიკალურ და დაუვიწყარ გამოცდილებად აქცევს.',
      items: [
        'არის თუ არა საქართველო კარგი მიმართულება ქორწილისთვის?',
        'რა ღირს ქორწილი საქართველოში?',
        'შეუძლიათ თუ არა უცხოელებს საქართველოში კანონიერად დაქორწინება?',
        'რამდენი ხნით ადრე უნდა დავჯავშნოთ?',
        'გვეხმარებით თუ არა დოკუმენტებში? რა შედის თქვენს მომსახურებაში?'
      ],
      answers: [
        'დიახ, საქართველო ერთ-ერთი საუკეთესო მიმართულებაა ქორწილისთვის. აქ ერთდროულად შეხვდებით ულამაზეს ბუნებას, მთებს, ზღვისპირეთსა და ისტორიულ ქალაქებს, მდიდარ კულტურას, ტრადიციებსა და სტუმართმოყვარე გარემოს. განსაკუთრებით გამოირჩევა ქართული სამზარეულო და ღვინო, რაც ქორწილს უნიკალურ და დაუვიწყარ გამოცდილებად აქცევს.',
        'ქორწილის ღირებულება საქართველოში დამოკიდებულია მრავალ ფაქტორზე. პირველ უფასო კონსულტაციაზე ერთად ვგეგმავთ ქორწილის დეტალებს და განვსაზღვრავთ მის ღირებულებას, როგორც ჩვენი პაკეტების მიხედვით, ისე თქვენს სურვილებსა და შესაძლებლობებზე მორგებით.',
        'დიახ, საქართველოში უცხოელებს მარტივად შეუძლიათ ოფიციალურად დაქორწინება. პროცესი საკმაოდ სწრაფი და მარტივია.',
        'რეკომენდებულია ქორწილის დაჯავშნა მინიმუმ 3-6 თვით ადრე, განსაკუთრებით თუ პოპულარულ სეზონზე გეგმავთ. დიდი და მასშტაბური ქორწილებისთვის კი უკეთესია 6-12 თვით ადრე დაგეგმვა, რათა ყველა დეტალი მშვიდად და ხარისხიანად მოესწროს.',
        'დიახ, ჩვენ სრულად ვართ ჩართული დოკუმენტების მომზადებასა და ქორწილის ორგანიზებაში. ჩვენს მომსახურებაში შედის პირველადი უფასო კონსულტაცია, საჭირო დოკუმენტების შეგროვებაში დახმარება, თარჯიმნის უზრუნველყოფა, ქორწინების რეგისტრაციის ორგანიზება, ასევე ლოკაციის, დეკორის, ფოტოგრაფისა და სხვა სერვისების დაგეგმვა. ჩვენი მიზანია, რომ პროცესი თქვენთვის იყოს მარტივი და სტრესისგან თავისუფალი.'
      ]
    },
    extras: {
      eyebrow: 'დამატებითი ფუნქციები',
      title: 'პრემიუმ დამატებები, რომლებიც გამოცდილებას თანამედროვესა და მარტივს ხდის.',
      items: [
        'საქორწილო ბიუჯეტის კალკულატორი',
        'ვენიუს მაძიებელი',
        'ონლაინ კონსულტაციის დაჯავშნა',
        'ინსტაგრამის გალერეა',
        'ვოთსაპის ჩატის ღილაკი'
      ]
    },
    contact: {
      eyebrow: 'კონტაქტი',
      title: 'დაგეგმეთ თქვენი საოცნებო ქორწილი',
      description: 'შეავსეთ ფორმა და ჩვენი გუნდი 24 საათში დაგიკავშირდებათ.',
      labels: {
        name: 'სახელი',
        email: 'ელფოსტა',
        phone: 'ტელეფონი / ვოთსაპი',
        weddingType: 'როგორი ქორწილი გსურთ?',
        date: 'ქორწილის თარიღი',
        guests: 'სტუმრების რაოდენობა',
        location: 'სასურველი ლოკაცია',
        budget: 'ბიუჯეტი',
        message: 'შეტყობინება'
      },
      placeholders: {
        name: 'თქვენი სრული სახელი',
        email: 'you@example.com',
        phone: '+995 ...',
        weddingType: 'აირჩიეთ ქორწილის ტიპი',
        guests: 'მაგალითად, 50',
        location: 'თბილისი, კახეთი, ყაზბეგი...',
        budget: '$6,000-დან',
        message: 'მოგვიყევით თქვენი ხედვის, სტუმრებისა და სტილის შესახებ.'
      },
      actions: {
        consultation: 'დაჯავშნეთ უფასო კონსულტაცია',
        inquiry: 'გამოგვიგზავნეთ მოთხოვნა',
        call: 'დაგეგმეთ ვიდეოზარი'
      },
      cardTitle: 'რატომ ირჩევენ წყვილები საქართველოს',
      reasons: [
        'უცხოელებისთვის ქორწინების სწრაფი და მარტივი პროცესი',
        'ლუქს ლოკაციები ვენახებში, მთებსა და ზღვისპირეთში',
        'ძალიან კარგი ღირებულება ევროპის ბევრ მიმართულებასთან შედარებით',
        'თბილი მასპინძლობა და დაუვიწყარი გამოცდილება სტუმრებისთვის'
      ]
    }
  }
};
