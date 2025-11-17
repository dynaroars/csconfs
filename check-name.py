import yaml

def conf_name(filename):
    with open(filename) as f:
        lines = f.readlines()
        res = [x.split(',')[1].lower() for x in lines]
    return set(res)

core_file = "./public/data/core_conferences.csv"
csrankings_file = "./public/data/csrankings_conferences.csv"
core = conf_name(core_file)
csranking = conf_name(csrankings_file)


with open('./public/data/conferences.yaml') as file:
    data = yaml.safe_load(file)
    conferences = set([x['name'].lower() for x in data])

print(conferences - core)
print(conferences - csranking)
