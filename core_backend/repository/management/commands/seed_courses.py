"""
Management command to seed all Cavendish University courses.

Usage:
    python manage.py seed_courses
"""
from django.core.management.base import BaseCommand
from repository.models import Department, Program, Course


COURSES_BY_PROGRAM = {
    'BSc-COM': [
        ('IT111', 'Computer Applications'),
        ('IT112', 'Computer Programming I'),
        ('IT113', 'Fundamentals of Computer Systems'),
        ('IT114', 'Foundation Mathematics I'),
        ('IT121', 'Data Structures'),
        ('IT123', 'Computer Programming II'),
        ('IT211', 'Systems Analysis and Design'),
        ('IT212', 'Database Management Systems'),
        ('IT213', 'Networking and Data Communication I'),
        ('IT214', 'Operating Systems'),
        ('IT215', 'Discrete Mathematics'),
        ('IT221', 'Digital Logic'),
        ('IT312', 'Algorithms and Complexity'),
        ('IT315', 'Information Assurance and Cyber Security'),
        ('IT321', 'Web Applications Development'),
        ('IT322', 'Advanced Database Management Systems'),
        ('IT323', 'Software Engineering'),
        ('IT324', 'Artificial Intelligence'),
        ('IT411', 'Programming Languages'),
        ('IT413', 'Mobile Applications Development'),
    ],
    'BBA': [
        ('BBA111', 'Business Communication and Study Skills'),
        ('BBA121', 'Business Mathematics'),
        ('BBA122', 'Financial Accounting I'),
        ('BBA211', 'Business Administration'),
        ('BBA212', 'Financial Accounting II'),
        ('BBA213', 'Business Statistics'),
        ('BBA221', 'Managerial Accounting'),
        ('BBA222', 'Marketing'),
        ('BBA311', 'Financial Management'),
        ('BBA313', 'Organizational Behaviour'),
        ('BBA314', 'Business Strategy'),
        ('BBA321', 'Strategic Management'),
        ('BBA323', 'Human Resource Management'),
        ('BBA413', 'Research Methods'),
        ('BBA422', 'Dissertation'),
    ],
    'BA-ECON': [
        ('EC112', 'Microeconomics'),
        ('EC122', 'Macroeconomics'),
        ('EC211', 'Intermediate Microeconomics'),
        ('EC212', 'Labour Economics'),
        ('EC223', 'Environmental Economics'),
        ('EC321', 'Advanced Statistics'),
        ('EC322', 'Econometrics I'),
        ('EC323', 'Advanced Macroeconomics'),
        ('EC324', 'Development Economics'),
        ('EC414', 'Industrial Economics'),
    ],
    'BA-BF': [
        ('AC111', 'Principles of Financial Accounting'),
        ('BF215', 'Introduction to Finance'),
        ('BF311', 'Money and Banking'),
        ('BF312', 'International Finance and Trade'),
        ('BF321', 'Risk Management'),
        ('BF322', 'Financial and Monetary System'),
        ('BF323', 'Legal Aspects of Banking'),
        ('BF324', 'Corporate and Merchant Banking'),
        ('BF325', 'Financial Reporting, Analysis and Planning'),
        ('BF411', 'Public Finance'),
    ],
    'BSc-PSCM': [
        ('PS111', 'Introduction to Purchasing and Supply Management I'),
        ('PS121', 'Introduction to Purchasing and Supply Management II'),
        ('PS211', 'Purchasing Operations and Tactics I'),
        ('PS212', 'Storage and Inventory Management'),
        ('PS213', 'Introduction to Logistics and Distribution'),
        ('PS214', 'Public Procurement I'),
        ('PS311', 'Contract Administration and Management I'),
        ('PS323', 'Operations Research'),
        ('PS411', 'Corporate Governance and Ethics'),
        ('PS412', 'International Supply Chain Management I'),
    ],
    'B-AC': [
        ('AC111', 'Principles of Financial Accounting'),
        ('AC123', 'Financial Accounting'),
        ('AC126', 'Cost Accounting'),
        ('AC211', 'Taxation'),
        ('AC213', 'Decision Making Techniques'),
        ('AC311', 'Audit and Assurance Services'),
        ('AC411', 'Specialized Accounts'),
    ],
    'BSc-PM': [
        ('PM113', 'Introduction to Project Management'),
        ('PM126', 'Project Management Applications'),
        ('PM224', 'Project Initiation'),
        ('PM225', 'Project Planning'),
        ('PM313', 'Project Implementation'),
        ('PM322', 'Procurement and Stores Management'),
        ('PM323', 'Time Management'),
        ('PM413', 'Monitoring and Control'),
        ('PM415', 'Project Financing'),
        ('PM423', 'Closure and Handover'),
    ],
    'BMCPR': [
        ('BMCPR211', 'Basics of Broadcasting'),
        ('BMCPR212', 'Mass Communication Concepts and Processes'),
        ('BMCPR213', 'Introduction to Journalism and Mass Communication'),
        ('BMCPR221', 'Fundamentals of Computers and Web Designing'),
        ('BMCPR222', 'Theories and Nature of Public Relations'),
        ('BMCPR223', 'News Writing, Reporting and Editing'),
        ('BMCPR311', 'On-line and Electronic Media Production'),
        ('BMCPR411', 'Media and Public Relations Management'),
        ('BMCPR422', 'Dissertation'),
    ],
    'BSW': [
        ('BSW211', 'Introduction to Social Welfare'),
        ('BSW212', 'Social Psychology'),
        ('BSW213', 'Social Work Methods'),
        ('BSW214', 'Sociology of Social Work'),
        ('BSW221', 'Social Theory and Policy'),
        ('BSW311', 'Development Support Communication'),
        ('BSW411', 'Evaluative Research'),
        ('BSW422', 'Dissertation'),
    ],
    'BDS': [
        ('DS211', 'Theories of Development'),
        ('DS212', 'Environmental and Sustainable Development'),
        ('DS213', 'Community Mobilization and Collective Action'),
        ('DS221', 'Rural and Urban Development'),
        ('DS222', 'Economics of Development'),
        ('DS223', 'Project Planning and Management'),
        ('DS311', 'Non-Governmental Organization and Development'),
        ('DS421', 'Dissertation'),
    ],
    'BAE-MI': [
        ('IT111', 'Computer Applications'),
        ('IT112', 'Computer Programming I'),
        ('CM121', 'Foundation Mathematics'),
        ('CM122', 'Discrete Mathematics'),
        ('ED211', 'Teaching Methods in ICT'),
        ('CM211', 'Calculus I and Matrices'),
        ('CU313', 'Research Methods'),
        ('ED411', 'Education Administration and Management'),
        ('CU414', 'Dissertation'),
    ],
    'BAE-EC': [
        ('ENG111', 'Introduction to Language and Linguistics'),
        ('CVE111', 'Introduction to Civic Education'),
        ('EDU112', 'Philosophy of Education'),
        ('EDU113', 'Sociology of Education'),
        ('EDU211', 'Human Learning Psychology'),
        ('EDU311', 'Guidance and Counseling Psychology'),
        ('EDU412', 'Curriculum Studies'),
    ],
    'LLB': [
        ('NCUZL112', 'Legal Communication and Study Skills'),
        ('NCUZL121', 'Book-Keeping and Accounts'),
        ('NCUZL122', 'Contract Law I'),
        ('NCUZL123', 'Criminal Law I'),
        ('NCUZL124', 'Law of Tort I'),
        ('NCUZL125', 'Constitutional Law I'),
        ('NCUZL211', 'Law of Contract II'),
        ('NCUZL221', 'Law of Evidence'),
        ('NCUZL311', 'Land Law and Property Relations II'),
        ('NCUZL321', 'Labor and Industrial Relations Law'),
        ('NCUZL322', 'Jurisprudence'),
        ('NCUZL411', 'Business Associations'),
        ('NCUZL412', 'Alternative Dispute Resolutions'),
    ],
    'MBChB': [
        ('OCM201', 'Introductory Organic Chemistry'),
        ('MPS201', 'Medical Physics and Statistics'),
        ('AIC201', 'Analytical and Inorganic Chemistry'),
        ('ESB201', 'Ecosystems and Biodiversity'),
        ('BHS202', 'Behavioural Sciences'),
        ('IMN315', 'Immunology and Vaccine Development'),
        ('ANA310', 'Gross Anatomy, Embryology and Histology'),
        ('PTH410', 'General and Systemic Pathology'),
        ('MED510', 'Internal Medicine'),
        ('SGY510', 'General Surgery'),
    ],
    'BSc-CS': [
        ('CANP210', 'Anatomy and Physiology'),
        ('CPNB220', 'Pharmacology and Biochemistry'),
        ('CMNP230', 'Microbiology and Pathology'),
        ('CCME240', 'Clinical Methods and Health Care Ethics'),
        ('CSGY310', 'Surgery'),
        ('COBG310', 'Obstetrics and Gynecology'),
        ('CPED310', 'Paediatrics'),
        ('CMED310', 'Internal Medicine'),
    ],
    'DRN': [
        ('SNG1105', 'Sociology in Nursing'),
        ('PSN1115', 'Psychology in Nursing'),
        ('FNS1110', 'Fundamentals of Nursing I'),
        ('APN1120', 'Anatomy and Physiology I'),
        ('PHN1130', 'Public Health Nursing I'),
        ('MSN1240', 'Medical Surgical Nursing'),
        ('PHR1250', 'Pharmacology I'),
    ],
}


class Command(BaseCommand):
    help = 'Seed Cavendish University courses into the database'

    def handle(self, *args, **options):
        existing = Course.objects.count()
        if existing > 0:
            self.stdout.write(self.style.WARNING(
                f'Already have {existing} courses. Nothing to do.'
            ))
            return

        created_count = 0
        skipped_programs = []

        for prog_code, courses in COURSES_BY_PROGRAM.items():
            try:
                program = Program.objects.get(code=prog_code)
            except Program.DoesNotExist:
                skipped_programs.append(prog_code)
                continue

            for code, name in courses:
                obj, created = Course.objects.get_or_create(
                    code=code,
                    defaults={'name': name, 'program': program},
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'✅ Created {created_count} courses.'
        ))
        self.stdout.write(f'Total courses now: {Course.objects.count()}')

        if skipped_programs:
            self.stdout.write(self.style.WARNING(
                f'⚠️  Skipped programs (not found): {", ".join(skipped_programs)}'
            ))