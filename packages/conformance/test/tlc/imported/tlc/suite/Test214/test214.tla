(*---
description: Ported from TLC's Test214.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test214.java
features:
  - tlc-suite
outcome: parse-error
config: ""
---*)
------------------------------ MODULE test214 ------------------------------ 
\* Test that USE and HIDE cannot contain arbitrary expressions as 
\* facts.

THEOREM bar == <<1, 2>>

USE bar, bar!1 (*ERROR*)
         

HIDE bar, TRUE (*ERROR*)

THEOREM xx == ASSUME TRUE PROVE FALSE 
 <1>2. USE TRUE (*ERROR*), bar , xx , xx!1 (*ERROR*)
 <1>3. QED

=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 18, col 11 to line 18, col 14 of module test214
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    3002:1 Parsing or semantic analysis failed.
---*)
