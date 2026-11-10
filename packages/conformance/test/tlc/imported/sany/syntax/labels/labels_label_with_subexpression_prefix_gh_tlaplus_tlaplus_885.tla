(*---
description: "Label with Subexpression Prefix (GH tlaplus/tlaplus #885). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/labels.txt
features:
  - sany-syntax
  - tlc-bug
outcome: success
correct:
  all:
    exit: 150
    transcript: |-
      | ***Parse Error***
      | `::' at line 29, col 32 to line 29, col 33 of module labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885 does not follow a label.
      | Residual stack trace follows:
      | ExtendableExpr starting at line 29, column 21.
      | Expression starting at line 29, column 21.
      | Quantified form starting at line 29, column 7.
      | Expression starting at line 29, column 7.
      | Definition starting at line 29, column 1.
      | Fatal errors while parsing TLA+ spec in file labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885
      | In module labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885
      | Could not parse module labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885 from file labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885.tla
      | *** Errors: 1
      | In module labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885
      | Could not parse module labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885 from file labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885.tla
      3002:1 Parsing or semantic analysis failed.
---*)
---- MODULE labels_label_with_subexpression_prefix_gh_tlaplus_tlaplus_885 ----
op == \A x \in {} : A!B!lbl(x) :: x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
