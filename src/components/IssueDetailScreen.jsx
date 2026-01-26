shareButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
  },
  
  // Hero
  hero: {
    padding: '20px',
    background: colors.cardBg,
  },
  
  heroTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  
  severityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  
  systemTag: {
    fontSize: '13px',
    color: colors.textSecondary,
    background: colors.background,
    padding: '4px 10px',
    borderRadius: '6px',
  },
  
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: colors.textPrimary,
    margin: '0 0 8px',
    lineHeight: 1.3,
  },
  
  carInfo: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '0 0 16px',
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  
  statCard: {
    padding: '14px',
    background: colors.background,
    borderRadius: '12px',
    textAlign: 'center',
  },
  
  statValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  statLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
  },
  
  // Boxes
  recommendationBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    background: colors.primaryLight,
    borderLeft: `4px solid ${colors.primary}`,
  },
  
  consequencesBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    background: colors.warningLight,
    borderLeft: `4px solid ${colors.warning}`,
  },
  
  boxIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  
  boxTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.primary,
    marginBottom: '4px',
  },
  
  consequencesTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.warning,
    marginBottom: '4px',
  },
  
  boxText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  
  // Section
  section: {
    background: colors.cardBg,
    marginTop: '8px',
  },
  
  sectionHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  chevron: {
    fontSize: '10px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
  },
  
  sectionContent: {
    padding: '0 20px 20px',
  },
  
  // Symptoms
  symptomRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  
  symptomBullet: {
    color: colors.primary,
    fontWeight: '700',
  },
  
  symptomText: {
    fontSize: '15px',
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  
  symptomCondition: {
    color: colors.textSecondary,
  },
  
  // Cause
  causeText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  
  // Solution Tabs
  solutionTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  
  solutionTab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '12px',
    background: colors.background,
    border: `2px solid ${colors.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
  },
  
  solutionTabActive: {
    background: colors.primaryLight,
    borderColor: colors.primary,
  },
  
  tabIcon: {
    fontSize: '20px',
  },
  
  tabLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  tabHint: {
    fontSize: '11px',
    color: colors.textTertiary,
  },
  
  // Solution Card
  solutionCard: {
    padding: '16px',
    background: colors.successLight,
    borderRadius: '12px',
  },
  
  solutionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 8px',
  },
  
  solutionDesc: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    margin: '0 0 16px',
  },
  
  solutionMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  
  metaIcon: {
    fontSize: '14px',
  },
  
  metaText: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Difficulty
  difficultyContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  
  difficultyLabel: {
    fontSize: '13px',
    color: colors.textSecondary,
  },
  
  difficultyDots: {
    display: 'flex',
    gap: '4px',
  },
  
  difficultyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  
  difficultyText: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Tools
  toolsSection: {
    marginBottom: '16px',
  },
  
  toolsTitle: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '8px',
    display: 'block',
  },
  
  toolsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  
  toolChip: {
    fontSize: '12px',
    padding: '6px 10px',
    background: colors.cardBg,
    borderRadius: '6px',
    color: colors.textPrimary,
  },
  
  // Warning
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    background: colors.warningLight,
    borderRadius: '8px',
    marginBottom: '16px',
  },
  
  warningIcon: {
    fontSize: '14px',
  },
  
  warningText: {
    fontSize: '13px',
    color: colors.textPrimary,
    lineHeight: 1.4,
  },
  
  // Where
  whereSection: {
    marginTop: '12px',
    padding: '12px',
    background: colors.cardBg,
    borderRadius: '8px',
  },
  
  whereLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
    display: 'block',
    marginBottom: '4px',
  },
  
  whereText: {
    fontSize: '14px',
    color: colors.textPrimary,
  },
  
  // Checklist
  checklist: {
    padding: '16px',
    background: colors.cardBg,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  
  checklistHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  
  checklistTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  checklistProgress: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
  
  checkbox: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    border: `2px solid`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  checkmark: {
    color: 'white',
    fontWeight: '700',
    fontSize: '12px',
  },
  
  checklistLabel: {
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  
  // VIN Prompt
  vinPrompt: {
    padding: '16px',
    background: colors.primaryLight,
    borderRadius: '12px',
    border: `1px dashed ${colors.primary}`,
    marginBottom: '16px',
  },
  
  vinHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  
  vinIcon: {
    fontSize: '16px',
  },
  
  vinTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  vinText: {
    fontSize: '13px',
    color: colors.textSecondary,
    margin: '0 0 12px',
  },
  
  vinInputRow: {
    display: 'flex',
    gap: '8px',
  },
  
  vinInput: {
    flex: 1,
    padding: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  
  vinButton: {
    padding: '12px 20px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Part Card
  partCard: {
    padding: '16px',
    background: colors.background,
    borderRadius: '12px',
    marginBottom: '12px',
  },
  
  partHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  
  partName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  partRevision: {
    fontSize: '12px',
    color: colors.success,
    background: colors.successLight,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  
  partNumber: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  
  partNumberLabel: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  partNumberValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  
  partManufacturer: {
    fontSize: '13px',
    color: colors.textSecondary,
    margin: '0 0 8px',
  },
  
  partPrice: {
    marginBottom: '12px',
  },
  
  priceRange: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  
  // Alternatives
  alternativesSection: {
    paddingTop: '12px',
    borderTop: `1px solid ${colors.border}`,
  },
  
  alternativesLabel: {
    fontSize: '12px',
    color: colors.textTertiary,
    display: 'block',
    marginBottom: '8px',
  },
  
  alternativesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  
  alternativeChip: {
    fontSize: '12px',
    padding: '4px 10px',
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    color: colors.textSecondary,
  },
  
  buyButton: {
    width: '100%',
    padding: '14px',
    background: colors.cardBg,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  
  // Reviews
  reviewCard: {
    padding: '14px',
    background: colors.background,
    borderRadius: '10px',
    marginBottom: '10px',
  },
  
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  
  reviewMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  
  reviewStatus: {
    fontSize: '12px',
    color: colors.success,
  },
  
  reviewText: {
    fontSize: '14px',
    lineHeight: 1.5,
    margin: 0,
    color: colors.textPrimary,
  },
  
  // CTA Section
  ctaSection: {
    padding: '20px',
    background: colors.cardBg,
    marginTop: '8px',
  },
  
  ctaPrimary: {
    width: '100%',
    padding: '16px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  
  ctaSecondaryRow: {
    display: 'flex',
    gap: '12px',
  },
  
  ctaSecondary: {
    flex: 1,
    padding: '12px',
    background: colors.background,
    color: colors.textSecondary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  
  // Footer
  footer: {
    padding: '20px',
    background: colors.background,
  },
  
  footerText: {
    fontSize: '12px',
    color: colors.textTertiary,
    lineHeight: 1.5,
    margin: 0,
  },
};
