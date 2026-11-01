(* automatically generated -- do not edit manually *)
theory tlapm_cc65bc imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./AtomicBakeryWithoutSMT.tla", line 210, characters 3-65 *)
lemma ob'6: (* a906fe891392ac1ad1b8e2ca8f676b54 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Punde_a
fixes a_CONSTANTunde_defaultInitValueunde_a
fixes a_VARIABLEunde_numunde_a a_VARIABLEunde_numunde_a'
fixes a_VARIABLEunde_flagunde_a a_VARIABLEunde_flagunde_a'
fixes a_VARIABLEunde_pcunde_a a_VARIABLEunde_pcunde_a'
fixes a_VARIABLEunde_unreadunde_a a_VARIABLEunde_unreadunde_a'
fixes a_VARIABLEunde_maxunde_a a_VARIABLEunde_maxunde_a'
fixes a_VARIABLEunde_nxtunde_a a_VARIABLEunde_nxtunde_a'
(* usable definition STATE_vars_ suppressed *)
(* usable definition STATE_Init_ suppressed *)
(* usable definition ACTION_p1_ suppressed *)
(* usable definition ACTION_p2_ suppressed *)
(* usable definition ACTION_p3_ suppressed *)
(* usable definition ACTION_p4_ suppressed *)
(* usable definition ACTION_p5_ suppressed *)
(* usable definition ACTION_p6_ suppressed *)
(* usable definition ACTION_p7_ suppressed *)
(* usable definition ACTION_p8_ suppressed *)
(* usable definition ACTION_p_ suppressed *)
(* usable definition ACTION_Next_ suppressed *)
(* usable definition TEMPORAL_Spec_ suppressed *)
(* usable definition STATE_Termination_ suppressed *)
(* usable definition STATE_MutualExclusion_ suppressed *)
(* usable definition STATE_TypeOK_ suppressed *)
(* usable definition STATE_GG_ suppressed *)
(* usable definition STATE_After_ suppressed *)
(* usable definition STATE_IInv_ suppressed *)
(* usable definition STATE_Inv_ suppressed *)
shows "(\<forall> a_CONSTANTunde_nunde_a \<in> (Nat) : (\<forall> a_CONSTANTunde_munde_a \<in> (Nat) : (\<forall> a_CONSTANTunde_qunde_a \<in> (Nat) : ((((((greater ((a_CONSTANTunde_nunde_a), (a_CONSTANTunde_munde_a)))) \<and> ((geq ((a_CONSTANTunde_munde_a), (a_CONSTANTunde_qunde_a)))))) \<Rightarrow> ((greater ((a_CONSTANTunde_nunde_a), (a_CONSTANTunde_qunde_a)))))))))"(is "PROP ?ob'6")
proof -
show "PROP ?ob'6"
by (auto dest: int_leq_less_trans)
qed
end
