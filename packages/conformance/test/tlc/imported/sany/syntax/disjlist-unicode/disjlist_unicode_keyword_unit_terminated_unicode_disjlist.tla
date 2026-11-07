(*---
description: Keyword-Unit-Terminated Unicode Disjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/disjlist-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE disjlist_unicode_keyword_unit_terminated_unicode_disjlist ----
op1 ≜
  ∨ 1
  ∨ 2
      ASSUME x

op2 ≜
  ∨ 3
  ∨ 4
      LOCAL INSTANCE ModuleName

op3 ≜
  ∨ 5
  ∨ 6
      -----------------

op4 ≜
  ∨ 7
  ∨ 8
      ---- MODULE Nested ----
      ====

op5 ≜
  ∨ 9
  ∨ 10
      VARIABLES x, y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file disjlist_unicode_keyword_unit_terminated_unicode_disjlist
    | In module disjlist_unicode_keyword_unit_terminated_unicode_disjlist
    | Cannot find source file for module ModuleName imported in module disjlist_unicode_keyword_unit_terminated_unicode_disjlist.
    | *** Errors: 1
    | In module disjlist_unicode_keyword_unit_terminated_unicode_disjlist
    | Cannot find source file for module ModuleName imported in module disjlist_unicode_keyword_unit_terminated_unicode_disjlist.
    3002:1 Parsing or semantic analysis failed.
---*)
