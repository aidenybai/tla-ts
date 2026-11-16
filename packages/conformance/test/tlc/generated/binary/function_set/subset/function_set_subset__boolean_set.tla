(*---
description: function_set of subset, a SubsetValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_subset__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SUBSET {1, 2}) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ({} :> FALSE @@ {1} :> FALSE @@ {2} :> FALSE @@ {1, 2} :> FALSE),
    |   ({} :> FALSE @@ {1} :> FALSE @@ {2} :> FALSE @@ {1, 2} :> TRUE),
    |   ({} :> FALSE @@ {1} :> FALSE @@ {2} :> TRUE @@ {1, 2} :> FALSE),
    |   ({} :> FALSE @@ {1} :> FALSE @@ {2} :> TRUE @@ {1, 2} :> TRUE),
    |   ({} :> FALSE @@ {1} :> TRUE @@ {2} :> FALSE @@ {1, 2} :> FALSE),
    |   ({} :> FALSE @@ {1} :> TRUE @@ {2} :> FALSE @@ {1, 2} :> TRUE),
    |   ({} :> FALSE @@ {1} :> TRUE @@ {2} :> TRUE @@ {1, 2} :> FALSE),
    |   ({} :> FALSE @@ {1} :> TRUE @@ {2} :> TRUE @@ {1, 2} :> TRUE),
    |   ({} :> TRUE @@ {1} :> FALSE @@ {2} :> FALSE @@ {1, 2} :> FALSE),
    |   ({} :> TRUE @@ {1} :> FALSE @@ {2} :> FALSE @@ {1, 2} :> TRUE),
    |   ({} :> TRUE @@ {1} :> FALSE @@ {2} :> TRUE @@ {1, 2} :> FALSE),
    |   ({} :> TRUE @@ {1} :> FALSE @@ {2} :> TRUE @@ {1, 2} :> TRUE),
    |   ({} :> TRUE @@ {1} :> TRUE @@ {2} :> FALSE @@ {1, 2} :> FALSE),
    |   ({} :> TRUE @@ {1} :> TRUE @@ {2} :> FALSE @@ {1, 2} :> TRUE),
    |   ({} :> TRUE @@ {1} :> TRUE @@ {2} :> TRUE @@ {1, 2} :> FALSE),
    |   ({} :> TRUE @@ {1} :> TRUE @@ {2} :> TRUE @@ {1, 2} :> TRUE) }
---*)
