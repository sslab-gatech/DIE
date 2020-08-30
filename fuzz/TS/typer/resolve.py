import json

def equal_type(t1, t2):
    return json.dumps(t1) == json.dumps(t2)

def resolve(output):
    records = {}
    
    for i, line in enumerate(output.split(b'\n')):
        line = line.strip()
        if not line.startswith(b"~~~TypeInfo:"): continue
        line = line[len(b"~~~TypeInfo:"):]
        idx = line.find(b">:")
        loc = line[0:idx+1].decode()
        t_str = line[idx+2:].decode()
        t = None
        try :
            t = json.loads(t_str)
        except : 
            return ""

        if not loc in records:
            records[loc] = t
        else:
            if records[loc]["type"] == "mixed": # already mixed type
                flag = False
                for subType in records[loc]["extra"]["subTypes"]:
                    if equal_type(subType, t):
                        flag = True
                        break
                if not flag:
                    records[loc]["extra"]["subTypes"].append(t)
            elif not equal_type(records[loc], t):
                records[loc] = {"type": "mixed", "extra": {"subTypes": [t, records[loc]]}}
            else:
                pass # the same; no need to update

    return records
