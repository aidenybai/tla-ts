---- MODULE DefineStep ----
F == 1
THEOREM TRUE
<1>1. DEFINE G == 2
<1>2. USE DEF F
<1>3. G = 2
  BY DEF <1>1
<1> QED
====
