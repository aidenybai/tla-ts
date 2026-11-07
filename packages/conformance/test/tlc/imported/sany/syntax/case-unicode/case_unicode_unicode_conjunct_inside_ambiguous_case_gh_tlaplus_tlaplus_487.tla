(*---
description: "Unicode Conjunct Inside Ambiguous Case (GH tlaplus/tlaplus #487). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/case-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487 ----
op ≜
  CASE A →
    ∧ CASE B → C
       □ D → E
  □ F → G

op2 ≜
  CASE H →
    ∧ CASE I → J
       □ OTHER → K
  □ L → M

op3 ≜
  CASE N →
    ∧ CASE O → P
       □ Q → R
    ∧ S
  □ T → U
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 21
    | line 10, col 8 to line 10, col 8 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `A'.
    | line 11, col 12 to line 11, col 12 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `B'.
    | line 11, col 16 to line 11, col 16 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `C'.
    | line 12, col 10 to line 12, col 10 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `D'.
    | line 12, col 14 to line 12, col 14 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `E'.
    | line 13, col 5 to line 13, col 5 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `F'.
    | line 13, col 9 to line 13, col 9 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `G'.
    | line 16, col 8 to line 16, col 8 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `H'.
    | line 17, col 12 to line 17, col 12 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `I'.
    | line 17, col 16 to line 17, col 16 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `J'.
    | line 18, col 18 to line 18, col 18 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `K'.
    | line 19, col 5 to line 19, col 5 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `L'.
    | line 19, col 9 to line 19, col 9 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `M'.
    | line 22, col 8 to line 22, col 8 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `N'.
    | line 23, col 12 to line 23, col 12 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `O'.
    | line 23, col 16 to line 23, col 16 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `P'.
    | line 24, col 10 to line 24, col 10 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `Q'.
    | line 24, col 14 to line 24, col 14 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `R'.
    | line 25, col 7 to line 25, col 7 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `S'.
    | line 26, col 5 to line 26, col 5 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `T'.
    | line 26, col 9 to line 26, col 9 of module case_unicode_unicode_conjunct_inside_ambiguous_case_gh_tlaplus_tlaplus_487
    | Unknown operator: `U'.
    3002:1 Parsing or semantic analysis failed.
---*)
