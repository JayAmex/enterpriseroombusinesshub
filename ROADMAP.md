# Enterprise Room Business Hub - Development Roadmap

## Future Enhancements

### Blog Features

#### Popular Posts Algorithm Enhancement
**Status:** On Hold  
**Priority:** Medium  
**Description:** Enhance the popular posts algorithm to use a more sophisticated scoring system instead of just view count.

**Current Implementation:**
- Popular posts are determined by view count only
- Posts are sorted by `view_count DESC`, with `published_date DESC` as tiebreaker

**Proposed Enhancements:**
1. **Multi-Factor Scoring System:**
   - View count (weighted)
   - Number of bookmarks/saves
   - Number of shares (social media)
   - Recency factor (recent views weighted more heavily)
   - Time window consideration (views in last 7/30 days)

2. **Alternative Approaches:**
   - Engagement-based: Combine views + bookmarks + shares
   - Time-based trending: Most viewed in last 7/30 days
   - Admin-curated: Manual "featured" flag option

**Implementation Notes:**
- Will require tracking additional metrics (shares, bookmarks already tracked)
- May need to add a `popularity_score` calculated column or computed field
- Consider caching popular posts for performance

**Dependencies:**
- Existing `view_count` column ✓
- Existing `saved_blog_posts` table for bookmarks ✓
- May need to add share tracking if not already implemented

---

## Completed Features

### Blog Enhancements (Completed)
- ✅ Search functionality
- ✅ Pagination
- ✅ Reading time estimate
- ✅ Related posts
- ✅ Author pages
- ✅ Popular posts (basic view-count based)
- ✅ Tags/keywords system
- ✅ Bookmark/save functionality
- ✅ Email sharing
- ✅ RSS feed

---

*Last Updated: January 2026*


