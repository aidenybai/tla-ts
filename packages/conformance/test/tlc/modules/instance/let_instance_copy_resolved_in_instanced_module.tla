(*---
description: "The definitions a LET INSTANCE copies keep the names of the instanced module, which the instancing module may lack or define otherwise."
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [instance]
includes: [FixCall.tla]
flags: [expression]
outcome: success
---*)
---- MODULE let_instance_copy_resolved_in_instanced_module ----
Test == /\ LET L == INSTANCE FixCall WITH c <- 2 IN L!G(1) = 4
        /\ LET L(p) == INSTANCE FixCall WITH c <- p IN L(3)!G(1) = 5
        /\ LET a + b == 99 IN LET L == INSTANCE FixCall WITH c <- 2 IN L!G(1) = 4
====

(*--- recorded
all:
  exit: 0
---*)
