(*---
description: Evaluates a random bool expression, seed 262, number 5212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(CASE TRUE -> 2147483647 [] OTHER -> -1 * (2147483647 \div 2147483647)), LET b8087 == (-2) IN CASE FALSE -> b8087 [] OTHER -> 2>> = (((-2) + (-1 \div -1)) :> CASE (TRUE /\ FALSE) -> (1 + 7) [] OTHER -> CASE FALSE -> 2147483647 [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 164 to line 14, col 167 of module random_05212 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 162.
    | Expression starting at line 14, column 161.
    | ExtendableExpr starting at line 14, column 160.
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | Fatal errors while parsing TLA+ spec in file random_05212
    | In module random_05212
    | Could not parse module random_05212 from file random_05212.tla
    | *** Errors: 1
    | In module random_05212
    | Could not parse module random_05212 from file random_05212.tla
    3002:1 Parsing or semantic analysis failed.
---*)
