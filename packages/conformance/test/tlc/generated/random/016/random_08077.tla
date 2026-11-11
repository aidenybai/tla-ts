(*---
description: Evaluates a random seq expression, seed 262, number 8077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF ((CHOOSE b12484 \in {x \in 1..3 : x > 1} : FALSE) \in (1..3 \cap 2..1)) THEN [[<<5, 6>> EXCEPT !.a = 3] EXCEPT !.a = CASE TRUE -> -1 [] OTHER -> 2147483647] ELSE ((-1 - 7) + (2147483647 \div -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 207 to line 14, col 210 of module random_08077 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 196.
    | Expression starting at line 14, column 196.
    | ExtendableExpr starting at line 14, column 195.
    | ExtendableExpr starting at line 14, column 184.
    | Expression starting at line 14, column 184.
    | Fatal errors while parsing TLA+ spec in file random_08077
    | In module random_08077
    | Could not parse module random_08077 from file random_08077.tla
    | *** Errors: 1
    | In module random_08077
    | Could not parse module random_08077 from file random_08077.tla
    3002:1 Parsing or semantic analysis failed.
---*)
