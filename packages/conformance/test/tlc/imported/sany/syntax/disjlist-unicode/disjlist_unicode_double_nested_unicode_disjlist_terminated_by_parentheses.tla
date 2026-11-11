(*---
description: Double-Nested Unicode Disjlist Terminated by Parentheses. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/disjlist-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE disjlist_unicode_double_nested_unicode_disjlist_terminated_by_parentheses ----
op ≜
  ∨ 1
  ∨  ∨ 2 + (
        ∨ 3
        ∨ 4
          )
     ∨ 5
  ∨ 6
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 10 to line 11, col 10 of module disjlist_unicode_double_nested_unicode_disjlist_terminated_by_parentheses
    | Could not find declaration or definition of symbol '+'.
    | line 11, col 8 to line 14, col 11 of module disjlist_unicode_double_nested_unicode_disjlist_terminated_by_parentheses
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
