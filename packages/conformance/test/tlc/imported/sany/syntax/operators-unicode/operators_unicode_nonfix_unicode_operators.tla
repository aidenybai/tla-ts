(*---
description: Nonfix Unicode Operators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_nonfix_unicode_operators ----
op ≜ {
  A!B!□(x),
  A!B!◇(x),
  A!B!¬(x),
  A!B!≈(x, y),
  A!B!≔(x, y),
  A!B!≍(x, y),
  A!B!◯(x, y),
  A!B!⩴(x, y),
  A!B!●(x, y),
  A!B!∩(x, y),
  A!B!⋅(x, y),
  A!B!∘(x, y),
  A!B!≅(x, y),
  A!B!∪(x, y),
  A!B!÷(x, y),
  A!B!≐(x, y),
  A!B!‥(x, y),
  A!B!…(x, y),
  A!B!≡(x, y),
  A!B!‼(x, y),
  A!B!≥(x, y),
  A!B!≫(x, y),
  A!B!⇔(x, y),
  A!B!⇒(x, y),
  A!B!∈(x, y),
  A!B!∧(x, y),
  A!B!⫤(x, y),
  A!B!↝(x, y),
  A!B!≤(x, y),
  A!B!≪(x, y),
  A!B!∨(x, y),
  A!B!⊣(x, y),
  A!B!≠(x, y),
  A!B!∉(x, y),
  A!B!⊙(x, y),
  A!B!⊖(x, y),
  A!B!⊕(x, y),
  A!B!⊘(x, y),
  A!B!⊗(x, y),
  A!B!⇸(x, y),
  A!B!≺(x, y),
  A!B!⪯(x, y),
  A!B!∝(x, y),
  A!B!⁇(x, y),
  A!B!⊨(x, y),
  A!B!⊢(x, y),
  A!B!∼(x, y),
  A!B!≃(x, y),
  A!B!⊓(x, y),
  A!B!⊔(x, y),
  A!B!⊏(x, y),
  A!B!⊑(x, y),
  A!B!⊐(x, y),
  A!B!⊒(x, y),
  A!B!⋆(x, y),
  A!B!⊂(x, y),
  A!B!⊆(x, y),
  A!B!≻(x, y),
  A!B!⪰(x, y),
  A!B!⊃(x, y),
  A!B!⊇(x, y),
  A!B!×(x, y),
  A!B!⊎(x, y),
  A!B!‖(x, y),
  A!B!≀(x, y),
  A!B!⁺(x)
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 66
    | line 10, col 3 to line 10, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B![]'.
    | line 11, col 3 to line 11, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!<>'.
    | line 12, col 3 to line 12, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\lnot'.
    | line 13, col 3 to line 13, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\approx'.
    | line 14, col 3 to line 14, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!:='.
    | line 15, col 3 to line 15, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\asymp'.
    | line 16, col 3 to line 16, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\bigcirc'.
    | line 17, col 3 to line 17, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!::='.
    | line 18, col 3 to line 18, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\bullet'.
    | line 19, col 3 to line 19, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\intersect'.
    | line 20, col 3 to line 20, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\cdot'.
    | line 21, col 3 to line 21, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\o'.
    | line 22, col 3 to line 22, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\cong'.
    | line 23, col 3 to line 23, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\union'.
    | line 24, col 3 to line 24, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\div'.
    | line 25, col 3 to line 25, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\doteq'.
    | line 26, col 3 to line 26, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!..'.
    | line 27, col 3 to line 27, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!...'.
    | line 28, col 3 to line 28, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\equiv'.
    | line 29, col 3 to line 29, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!!!'.
    | line 30, col 3 to line 30, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\geq'.
    | line 31, col 3 to line 31, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\gg'.
    | line 32, col 3 to line 32, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\equiv'.
    | line 33, col 3 to line 33, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!=>'.
    | line 34, col 3 to line 34, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\in'.
    | line 35, col 3 to line 35, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\land'.
    | line 36, col 3 to line 36, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!=|'.
    | line 37, col 3 to line 37, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!~>'.
    | line 38, col 3 to line 38, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\leq'.
    | line 39, col 3 to line 39, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\ll'.
    | line 40, col 3 to line 40, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\lor'.
    | line 41, col 3 to line 41, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!-|'.
    | line 42, col 3 to line 42, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!/='.
    | line 43, col 3 to line 43, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\notin'.
    | line 44, col 3 to line 44, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\odot'.
    | line 45, col 3 to line 45, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\ominus'.
    | line 46, col 3 to line 46, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\oplus'.
    | line 47, col 3 to line 47, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\oslash'.
    | line 48, col 3 to line 48, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\otimes'.
    | line 49, col 3 to line 49, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!-+->'.
    | line 50, col 3 to line 50, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\prec'.
    | line 51, col 3 to line 51, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\preceq'.
    | line 52, col 3 to line 52, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\propto'.
    | line 53, col 3 to line 53, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!??'.
    | line 54, col 3 to line 54, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!|='.
    | line 55, col 3 to line 55, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!|-'.
    | line 56, col 3 to line 56, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sim'.
    | line 57, col 3 to line 57, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\simeq'.
    | line 58, col 3 to line 58, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqcap'.
    | line 59, col 3 to line 59, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqcup'.
    | line 60, col 3 to line 60, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqsubset'.
    | line 61, col 3 to line 61, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqsubseteq'.
    | line 62, col 3 to line 62, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqsupset'.
    | line 63, col 3 to line 63, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\sqsupseteq'.
    | line 64, col 3 to line 64, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\star'.
    | line 65, col 3 to line 65, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\subset'.
    | line 66, col 3 to line 66, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\subseteq'.
    | line 67, col 3 to line 67, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\succ'.
    | line 68, col 3 to line 68, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\succeq'.
    | line 69, col 3 to line 69, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\supset'.
    | line 70, col 3 to line 70, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\supseteq'.
    | line 71, col 3 to line 71, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\times'.
    | line 72, col 3 to line 72, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\uplus'.
    | line 73, col 3 to line 73, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!||'.
    | line 74, col 3 to line 74, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!\wr'.
    | line 75, col 3 to line 75, col 7 of module operators_unicode_nonfix_unicode_operators
    | Unknown operator: `A!B!^+'.
    3002:1 Parsing or semantic analysis failed.
---*)
