class querrys:
    def __init__(self):
        pass
    
    def getAssInsc(self,type ):
        type =str(type) 
        print(type)
        return f'''
            SELECT * FROM FADU_PERSON
            JOIN FADU_{type.upper()} as type on type.Person_Id =id 
            WHERE Ass_id = ?
            '''