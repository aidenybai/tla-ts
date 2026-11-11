(*---
description: "SubBag(EmptyBag) is {EmptyBag}: SubBag uses the TLA+ definition."
ref: tla2sany/StandardModules/Bags.tla
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE subbag_empty ----
EXTENDS Bags, TLC, Naturals
Test == SubBag(EmptyBag) = {EmptyBag}
====

(*--- recorded
all:
  exit: 0
---*)
