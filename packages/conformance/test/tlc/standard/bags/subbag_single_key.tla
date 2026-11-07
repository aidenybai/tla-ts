(*---
description: SubBag gives each count up to the bag's, and the empty bag.
ref: tla2sany/StandardModules/Bags.tla
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE subbag_single_key ----
EXTENDS Bags, TLC, Naturals
Test == SubBag(1 :> 2) = {EmptyBag, 1 :> 1, 1 :> 2}
====

(*--- recorded
all:
  exit: 0
---*)
