(*---
description: "DOMAIN of d :> e holds d."
ref: "tlc2/value/impl/FcnRcdValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_colon_greater ----
EXTENDS Integers, TLC
Test == DOMAIN ({1} :> 2) = {{1}}
====

(*--- recorded
all:
  exit: 0
---*)
