(*---
description: "A label may share its name with a defined operator, since labels are a separate namespace."
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_same_name_as_definition ----
x == 1
Op == x:: TRUE
Test == Op /\ Op!x
====

(*--- recorded
all:
  exit: 0
---*)
