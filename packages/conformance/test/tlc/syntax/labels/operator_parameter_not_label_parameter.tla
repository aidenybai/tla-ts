(*---
description: "An operator's own parameter need not be a label parameter."
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE operator_parameter_not_label_parameter ----
Op(x) == l:: x = 1
Test == Op(1)!l /\ ~Op(2)!l
====

(*--- recorded
all:
  exit: 0
---*)
