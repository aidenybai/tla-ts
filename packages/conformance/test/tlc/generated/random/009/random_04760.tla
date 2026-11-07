(*---
description: Evaluates a random bool expression, seed 262, number 4760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [<<5, 6>> EXCEPT ![3] = 2] \cap ((2..1 \cap Nat) \cup (1 .. 3))) \subseteq DOMAIN ((2147483647 * -1) :> CASE TRUE -> 7 [] OTHER -> 1)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 120 to line 14, col 120 of module random_04760 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Fatal errors while parsing TLA+ spec in file random_04760
    | In module random_04760
    | Could not parse module random_04760 from file random_04760.tla
    | *** Errors: 1
    | In module random_04760
    | Could not parse module random_04760 from file random_04760.tla
    3002:1 Parsing or semantic analysis failed.
---*)
