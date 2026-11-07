(*---
description: The operator can be a LAMBDA.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_and_set_lambda ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetAndSet(63, LAMBDA o, v : <<o, v>>, "n", "d") = "d" /\ TLCGet(63) = <<"d", "n">>
====

(*--- recorded
all:
  exit: 0
---*)
