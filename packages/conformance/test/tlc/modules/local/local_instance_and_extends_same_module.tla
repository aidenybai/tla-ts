(*---
description: A module both extended and LOCAL-instanced defines nothing twice.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_instance_and_extends_same_module ----
EXTENDS Naturals
LOCAL INSTANCE Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
