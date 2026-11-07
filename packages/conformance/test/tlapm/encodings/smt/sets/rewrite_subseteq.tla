(*---
description: With --debug rwsetext, \subseteq in a positive position is meant to become a quantified implication, but the operator carries no type parameter at that point, so the rewriter raises Encode.Rewrite internal error and the SMT backend is not run. See src/encode/n_rewrite.ml#apply_ext_visitor, line 738.
ref: src/encode/n_rewrite.ml#apply_ext
features: [tlapm-bug]
mode: encoding
args: ['--debug', rwsetext]
outcome: failed
---*)
---- MODULE rewrite_subseteq ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T PROVE S \subseteq S \cup T
  BY SMT
====

(*--- recorded
all:
  exit: 10
  transcript: |
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: Encode.Rewrite: internal error
    @already: false
    @obl: 
    ASSUME NEW CONSTANT S,
           NEW CONSTANT T,
           TRUE 
    PROVE  S \subseteq S \cup T

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./rewrite_subseteq.tla", line 12, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT S,
                      NEW CONSTANT T,
                      SMT 
               PROVE  S \subseteq S \cup T
    File "./rewrite_subseteq.tla", line 9, character 1 to line 13, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"rewrite_subseteq"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory rewrite_subseteq imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    end

    --- z3
---*)
