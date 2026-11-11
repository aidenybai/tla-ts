(*---
description: Unicode CASE Separator One Column Right of Disjunction Bullet. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/case-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet ----
op ≜
  CASE A →
    ∨ CASE B → C
       □ D → E
     □ F → G
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 7
    | line 10, col 8 to line 10, col 8 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `A'.
    | line 11, col 12 to line 11, col 12 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `B'.
    | line 11, col 16 to line 11, col 16 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `C'.
    | line 12, col 10 to line 12, col 10 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `D'.
    | line 12, col 14 to line 12, col 14 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `E'.
    | line 13, col 8 to line 13, col 8 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `F'.
    | line 13, col 12 to line 13, col 12 of module case_unicode_unicode_case_separator_one_column_right_of_disjunction_bullet
    | Unknown operator: `G'.
    3002:1 Parsing or semantic analysis failed.
---*)
