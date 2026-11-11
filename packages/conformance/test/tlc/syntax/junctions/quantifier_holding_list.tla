(*---
description: A list inside a quantifier body ends where the outer one resumes.
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_holding_list ----
Test ==
  /\ \A z \in {1} : /\ z = 1
                    /\ z # 2
  /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
